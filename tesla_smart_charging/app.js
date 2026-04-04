'use strict';

const Homey = require('homey');
const PriceManager = require('./lib/PriceManager');
const Scheduler = require('./lib/Scheduler');

const DEFAULT_SETTINGS = {
  area: 'SE3',
  minCharge: 20,
  defaultTarget: 50,
  chargeRateKw: 11,
  batteryCapacityKwh: 75,
  autoCharge: true,
};

class TeslaSmartChargingApp extends Homey.App {
  async onInit() {
    this.log('Tesla Smart Charging starting...');

    this._priceManager = new PriceManager(this.homey);
    this._nextTrip = null;
    this._lastCharging = null; // true/false – previous hour's charging state

    this._registerFlowCards();
    this._registerApiRoutes();
    this._restoreTrip();

    // Clear price cache at midnight
    this.homey.setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        this._priceManager.clearCache();
      }
    }, 5 * 60 * 1000);

    // Run scheduler every hour at :01
    this._scheduleNextRun();
    await this._runScheduler();
  }

  _scheduleNextRun() {
    const now = new Date();
    const msUntilNextHour =
      (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 + 60 * 1000;
    this.homey.setTimeout(() => {
      this._runScheduler().catch(e => this.error('Scheduler error:', e));
      this.homey.setInterval(() => {
        this._runScheduler().catch(e => this.error('Scheduler error:', e));
      }, 3600 * 1000);
    }, msUntilNextHour);
  }

  async _runScheduler() {
    const settings = this._getSettings();
    if (!settings.autoCharge) {
      this.log('Auto charge disabled, skipping scheduler');
      return;
    }

    let currentBattery;
    try {
      currentBattery = await this._getTeslaBattery();
    } catch (e) {
      this.error('Could not read Tesla battery:', e.message);
      return;
    }

    let combinedPrices;
    try {
      combinedPrices = await this._priceManager.getCombinedPrices(settings.area);
    } catch (e) {
      this.error('Could not fetch prices:', e.message);
      return;
    }

    const scheduler = new Scheduler({
      currentBattery,
      minCharge: settings.minCharge,
      defaultTarget: settings.defaultTarget,
      chargeRateKwh: settings.chargeRateKw,
      batteryCapacityKwh: settings.batteryCapacityKwh,
      nextTrip: this._nextTrip,
      combinedPrices,
      priceManager: this._priceManager,
    });

    const { shouldCharge, reason, cheapHours } = scheduler.decide();
    this.log(`Scheduler decision: shouldCharge=${shouldCharge}, reason=${reason}, battery=${currentBattery}%`);

    try {
      await this._setTeslaCharging(shouldCharge);
    } catch (e) {
      this.error('Could not set Tesla charging state:', e.message);
      return;
    }

    // Fire flow triggers on state changes
    if (shouldCharge && this._lastCharging === false) {
      this._triggerCard('cheap_charging_started').catch(e => this.error(e));
    }
    if (!shouldCharge && this._lastCharging === true) {
      this._triggerCard('cheap_charging_ended').catch(e => this.error(e));
    }
    if (reason === 'emergency' && this._lastCharging !== true) {
      this._triggerCard('emergency_charging_activated').catch(e => this.error(e));
    }

    this._lastCharging = shouldCharge;
    this._lastDecision = { shouldCharge, reason, cheapHours, currentBattery, updatedAt: new Date() };
  }

  // ---------------------------------------------------------------------------
  // Tesla device integration
  // ---------------------------------------------------------------------------

  async _getTeslaDevice() {
    const teslaApp = this.homey.apps.getApp('com.teslamotors.tesla');
    if (!teslaApp) throw new Error('Tesla app not installed');
    const devices = await this.homey.devices.getDevices();
    const tesla = Object.values(devices).find(
      d => d.driverUri && d.driverUri.includes('com.teslamotors.tesla')
    );
    if (!tesla) throw new Error('No Tesla device found');
    return tesla;
  }

  async _getTeslaBattery() {
    const device = await this._getTeslaDevice();
    const battery = device.capabilitiesObj && device.capabilitiesObj['measure_battery'];
    if (!battery) throw new Error('Battery capability not found on Tesla device');
    return battery.value;
  }

  async _setTeslaCharging(enabled) {
    const device = await this._getTeslaDevice();
    await device.setCapabilityValue('charging_enabled', enabled);
    this.log(`Tesla charging set to: ${enabled}`);
  }

  // ---------------------------------------------------------------------------
  // Flow cards
  // ---------------------------------------------------------------------------

  _registerFlowCards() {
    this._cheapChargingStarted = this.homey.flow.getTriggerCard('cheap_charging_started');
    this._cheapChargingEnded = this.homey.flow.getTriggerCard('cheap_charging_ended');
    this._emergencyChargingActivated = this.homey.flow.getTriggerCard('emergency_charging_activated');

    this.homey.flow
      .getConditionCard('is_cheap_electricity')
      .registerRunListener(async () => {
        const settings = this._getSettings();
        const current = await this._priceManager.getCurrentPrice(settings.area);
        const combined = await this._priceManager.getCombinedPrices(settings.area);
        if (!current || combined.length === 0) return false;
        const avg = combined.reduce((s, p) => s + p.price, 0) / combined.length;
        return current.price < avg;
      });

    this.homey.flow
      .getActionCard('set_next_trip')
      .registerRunListener(async args => {
        this._nextTrip = {
          departureTime: new Date(args.departureTime),
          targetPercent: args.targetPercent,
        };
        this.homey.settings.set('nextTrip', {
          departureTime: this._nextTrip.departureTime.toISOString(),
          targetPercent: this._nextTrip.targetPercent,
        });
        this.log(`Next trip set: ${this._nextTrip.departureTime.toISOString()} @ ${this._nextTrip.targetPercent}%`);
        await this._runScheduler();
      });
  }

  async _triggerCard(id) {
    const card = this.homey.flow.getTriggerCard(id);
    await card.trigger();
  }

  // ---------------------------------------------------------------------------
  // Webhook API
  // ---------------------------------------------------------------------------

  _registerApiRoutes() {
    // GET /status
    this.homey.api.registerGetHandler('/status', async (query, body) => {
      const settings = this._getSettings();
      let battery = null;
      try { battery = await this._getTeslaBattery(); } catch (_) {}

      let currentPrice = null;
      try {
        currentPrice = await this._priceManager.getCurrentPrice(settings.area);
      } catch (_) {}

      return {
        battery,
        currentPrice: currentPrice ? currentPrice.price : null,
        lastDecision: this._lastDecision || null,
        nextTrip: this._nextTrip
          ? {
              departureTime: this._nextTrip.departureTime.toISOString(),
              targetPercent: this._nextTrip.targetPercent,
            }
          : null,
        settings,
      };
    });

    // GET /prices
    this.homey.api.registerGetHandler('/prices', async (query, body) => {
      const settings = this._getSettings();
      const combined = await this._priceManager.getCombinedPrices(settings.area);
      if (combined.length === 0) return { prices: [] };
      const avg = combined.reduce((s, p) => s + p.price, 0) / combined.length;
      return {
        prices: combined.map(p => ({
          time: p.time_start.toISOString(),
          price: p.price,
          cheap: p.price < avg,
          current: this._priceManager.isCurrentHour(p.time_start),
        })),
        average: avg,
      };
    });

    // POST /trip
    this.homey.api.registerPostHandler('/trip', async (body) => {
      const { departureTime, targetPercent } = body;
      if (!departureTime || targetPercent == null) {
        throw new Error('departureTime and targetPercent are required');
      }
      const dep = new Date(departureTime);
      if (isNaN(dep.getTime())) throw new Error('Invalid departureTime');
      const pct = Number(targetPercent);
      if (pct < 20 || pct > 100) throw new Error('targetPercent must be 20-100');

      this._nextTrip = { departureTime: dep, targetPercent: pct };
      this.homey.settings.set('nextTrip', {
        departureTime: dep.toISOString(),
        targetPercent: pct,
      });
      this.log(`Trip set via API: ${dep.toISOString()} @ ${pct}%`);
      this._runScheduler().catch(e => this.error(e));
      return { ok: true, trip: { departureTime: dep.toISOString(), targetPercent: pct } };
    });

    // DELETE /trip
    this.homey.api.registerDeleteHandler('/trip', async (body) => {
      this._nextTrip = null;
      this.homey.settings.set('nextTrip', null);
      this.log('Trip cleared via API');
      this._runScheduler().catch(e => this.error(e));
      return { ok: true };
    });

    // POST /settings
    this.homey.api.registerPostHandler('/settings', async (body) => {
      const allowed = ['area', 'minCharge', 'defaultTarget', 'chargeRateKw', 'batteryCapacityKwh', 'autoCharge'];
      const current = this._getSettings();
      for (const key of allowed) {
        if (body[key] !== undefined) current[key] = body[key];
      }
      this.homey.settings.set('appSettings', current);
      this.log('Settings updated via API');
      return { ok: true, settings: current };
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  _getSettings() {
    const stored = this.homey.settings.get('appSettings') || {};
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  _restoreTrip() {
    const stored = this.homey.settings.get('nextTrip');
    if (stored && stored.departureTime) {
      const dep = new Date(stored.departureTime);
      if (dep > new Date()) {
        this._nextTrip = { departureTime: dep, targetPercent: stored.targetPercent };
        this.log(`Restored trip: ${dep.toISOString()} @ ${stored.targetPercent}%`);
      }
    }
  }
}

module.exports = TeslaSmartChargingApp;
