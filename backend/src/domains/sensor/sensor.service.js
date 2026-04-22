const { EVENTS } = require("../../../../shared/events");

class SensorService {
  constructor({ store, eventBus }) {
    this.store = store;
    this.eventBus = eventBus;
  }

  ingestReading(reading) {
    const normalized = {
      ...reading,
      timestamp: reading.timestamp || new Date().toISOString(),
    };

    const saved = this.store.add(normalized);
    this.eventBus.emit(EVENTS.SENSOR_READING_RECEIVED, saved);
    return saved;
  }

  listReadings() {
    return this.store.list();
  }
}

module.exports = { SensorService };
