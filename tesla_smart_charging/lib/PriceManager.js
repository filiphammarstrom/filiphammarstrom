'use strict';

const https = require('https');

class PriceManager {
  constructor(homey) {
    this.homey = homey;
    this._cache = {};
  }

  /**
   * Fetches hourly prices for a given date and area.
   * Returns array of { hour: 0-23, price: SEK/kWh }
   */
  async getPricesForDate(date, area) {
    const key = `${this._dateKey(date)}_${area}`;
    if (this._cache[key]) return this._cache[key];

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const url = `https://www.elpriset-just-nu.se/api/v1/prices/${yyyy}/${mm}-${dd}_${area}.json`;

    const raw = await this._fetch(url);
    const prices = raw.map(entry => ({
      hour: new Date(entry.time_start).getHours(),
      price: entry.SEK_per_kWh,
      time_start: new Date(entry.time_start),
    }));

    this._cache[key] = prices;
    return prices;
  }

  /**
   * Returns combined price list for today + tomorrow (if available).
   * Each entry: { hour (absolute, 0-47), price, time_start }
   */
  async getCombinedPrices(area) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayPrices = await this.getPricesForDate(today, area);

    let tomorrowPrices = [];
    try {
      tomorrowPrices = await this.getPricesForDate(tomorrow, area);
    } catch (e) {
      this.homey.log('Tomorrow prices not available yet');
    }

    const combined = todayPrices.map(p => ({ ...p, dayOffset: 0 }));
    for (const p of tomorrowPrices) {
      combined.push({ ...p, hour: p.hour + 24, dayOffset: 1 });
    }

    return combined;
  }

  /**
   * Returns prices from now up to the given end time.
   */
  async getPricesInWindow(area, fromTime, toTime) {
    const prices = await this.getCombinedPrices(area);
    return prices.filter(p => {
      const t = p.time_start;
      return t >= fromTime && t < toTime;
    });
  }

  /**
   * Returns the N cheapest hours from a price list.
   * Each item must have { hour, price, time_start }.
   */
  cheapestHours(prices, n) {
    const sorted = [...prices].sort((a, b) => a.price - b.price);
    return sorted.slice(0, n);
  }

  /**
   * Returns true if the given time_start falls in the current hour.
   */
  isCurrentHour(time_start) {
    const now = new Date();
    return (
      time_start.getFullYear() === now.getFullYear() &&
      time_start.getMonth() === now.getMonth() &&
      time_start.getDate() === now.getDate() &&
      time_start.getHours() === now.getHours()
    );
  }

  /**
   * Returns the current hour's price entry.
   */
  async getCurrentPrice(area) {
    const prices = await this.getCombinedPrices(area);
    return prices.find(p => this.isCurrentHour(p.time_start)) || null;
  }

  clearCache() {
    this._cache = {};
  }

  _dateKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  _fetch(url) {
    return new Promise((resolve, reject) => {
      https.get(url, res => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }
}

module.exports = PriceManager;
