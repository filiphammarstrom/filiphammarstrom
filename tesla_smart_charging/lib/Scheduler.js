'use strict';

class Scheduler {
  /**
   * @param {object} opts
   * @param {number} opts.currentBattery     - Current battery level (0-100)
   * @param {number} opts.minCharge          - Emergency threshold (default 20)
   * @param {number} opts.defaultTarget      - Normal charge target (default 50)
   * @param {number} opts.chargeRateKwh      - Charge rate in kW (default 11)
   * @param {number} opts.batteryCapacityKwh - Battery capacity in kWh (default 75)
   * @param {object|null} opts.nextTrip      - { departureTime: Date, targetPercent: number }
   * @param {Array}  opts.combinedPrices     - From PriceManager.getCombinedPrices()
   * @param {object} opts.priceManager       - PriceManager instance (for isCurrentHour, cheapestHours)
   */
  constructor(opts) {
    this.currentBattery = opts.currentBattery;
    this.minCharge = opts.minCharge || 20;
    this.defaultTarget = opts.defaultTarget || 50;
    this.chargeRateKwh = opts.chargeRateKwh || 11;
    this.batteryCapacityKwh = opts.batteryCapacityKwh || 75;
    this.nextTrip = opts.nextTrip || null;
    this.combinedPrices = opts.combinedPrices || [];
    this.priceManager = opts.priceManager;
  }

  /**
   * Main decision method.
   * Returns { shouldCharge: bool, reason: string, cheapHours: Array }
   */
  decide() {
    const now = new Date();

    // 1. Emergency charging
    if (this.currentBattery <= this.minCharge) {
      return {
        shouldCharge: true,
        reason: 'emergency',
        cheapHours: [],
      };
    }

    // 2. Trip mode
    if (this.nextTrip) {
      const { departureTime, targetPercent } = this.nextTrip;
      const msUntilDeparture = departureTime - now;
      const hoursUntilDeparture = msUntilDeparture / 3600000;

      if (hoursUntilDeparture <= 0) {
        // Trip is past, ignore
      } else if (hoursUntilDeparture <= 48) {
        const needed = Math.max(0, targetPercent - this.currentBattery);
        const chargingHoursNeeded = this._hoursNeeded(needed);

        const windowPrices = this.combinedPrices.filter(
          p => p.time_start >= now && p.time_start < departureTime
        );

        if (windowPrices.length === 0) {
          // No data in window, charge now to be safe
          return { shouldCharge: true, reason: 'trip_no_data', cheapHours: [] };
        }

        const cheapHours = this.priceManager.cheapestHours(
          windowPrices,
          Math.ceil(chargingHoursNeeded)
        );
        const isCurrentCheap = cheapHours.some(h =>
          this.priceManager.isCurrentHour(h.time_start)
        );

        return {
          shouldCharge: isCurrentCheap,
          reason: isCurrentCheap ? 'trip_cheap_hour' : 'trip_waiting_for_cheaper',
          cheapHours,
        };
      }
    }

    // 3. Normal mode
    if (this.currentBattery >= this.defaultTarget) {
      return {
        shouldCharge: false,
        reason: 'target_reached',
        cheapHours: [],
      };
    }

    const needed = Math.max(0, this.defaultTarget - this.currentBattery);
    const chargingHoursNeeded = this._hoursNeeded(needed);

    // Use all available prices (up to 36h horizon)
    const horizon = new Date(now.getTime() + 36 * 3600000);
    const windowPrices = this.combinedPrices.filter(
      p => p.time_start >= now && p.time_start < horizon
    );

    if (windowPrices.length < chargingHoursNeeded) {
      // Not enough data — charge now conservatively
      return { shouldCharge: true, reason: 'insufficient_data', cheapHours: [] };
    }

    // Safety: ensure we can charge before running out
    const hoursUntilEmpty = this._hoursUntilEmpty();
    const latestSafeStart = new Date(now.getTime() + (hoursUntilEmpty - chargingHoursNeeded) * 3600000);
    const safePrices = windowPrices.filter(p => p.time_start <= latestSafeStart);

    const poolPrices = safePrices.length >= chargingHoursNeeded ? safePrices : windowPrices;
    const cheapHours = this.priceManager.cheapestHours(poolPrices, Math.ceil(chargingHoursNeeded));

    const isCurrentCheap = cheapHours.some(h =>
      this.priceManager.isCurrentHour(h.time_start)
    );

    return {
      shouldCharge: isCurrentCheap,
      reason: isCurrentCheap ? 'normal_cheap_hour' : 'normal_waiting_for_cheaper',
      cheapHours,
    };
  }

  /** How many kWh hours needed to charge `percentNeeded` percent */
  _hoursNeeded(percentNeeded) {
    const kwhNeeded = (percentNeeded / 100) * this.batteryCapacityKwh;
    return kwhNeeded / this.chargeRateKwh;
  }

  /** Approximate hours until battery drops to minCharge (assumes ~0 passive drain by default) */
  _hoursUntilEmpty() {
    const marginPercent = this.currentBattery - this.minCharge;
    // Assume ~1% passive drain per 24h (negligible, but provides a safe upper bound)
    return marginPercent * 24;
  }
}

module.exports = Scheduler;
