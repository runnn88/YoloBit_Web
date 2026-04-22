const { EVENTS } = require("../../../../shared/events");
const { TOPICS } = require("../../../../shared/topics");

class DeviceService {
  constructor({ store, eventBus, mqttGateway }) {
    this.store = store;
    this.eventBus = eventBus;
    this.mqttGateway = mqttGateway;
  }

  setPump(enabled) {
    const message = enabled ? "ON" : "OFF";
    const command = {
      deviceId: "pump-001",
      topic: TOPICS.controls.pumpSet,
      message,
      timestamp: new Date().toISOString(),
    };

    this.mqttGateway.publishControl(command.topic, command.message);
    this.store.addCommand(command);

    const nextState = this.store.updateState(command.deviceId, { enabled });
    this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, nextState);
    return nextState;
  }

  listState() {
    return this.store.getState();
  }

  recordOutgoingCommand(topic, message) {
    return { topic, message };
  }
}

module.exports = { DeviceService };
