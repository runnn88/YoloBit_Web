class SensorStore {
  constructor() {
    this.readings = [];
  }

  add(reading) {
    this.readings.unshift(reading);
    this.readings = this.readings.slice(0, 100);
    return reading;
  }

  list() {
    return this.readings;
  }
}

module.exports = { SensorStore };
