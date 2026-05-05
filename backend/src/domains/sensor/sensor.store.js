class SensorStore {
  constructor() {
    this.history = [];
    this.latestByKey = {};
  }

  add(reading) {
    const key = `${reading.deviceId}:${reading.metric}`;
    this.latestByKey[key] = reading;
    this.history.unshift(reading);
    this.history = this.history.slice(0, 200);
    return reading;
  }

  listLatest() {
    const metricOrder = { temp: 1, humidity: 2, soil: 3, lux: 4, light: 5 };
    return Object.values(this.latestByKey).sort((left, right) => {
      if (left.deviceId !== right.deviceId) {
        return left.deviceId.localeCompare(right.deviceId);
      }
      return (metricOrder[left.metric] || 99) - (metricOrder[right.metric] || 99);
    });
  }

  listHistory() {
    return this.history;
  }
}

module.exports = { SensorStore };
