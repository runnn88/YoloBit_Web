const { TOPICS } = require("../../../shared/topics");

function createMqttGateway({ sensorService, deviceService }) {
  return {
    subscribe() {
      return [TOPICS.sensors.tempValue, TOPICS.sensors.soilValue];
    },
    handleMessage(topic, payload) {
      if (topic === TOPICS.sensors.tempValue || topic === TOPICS.sensors.soilValue) {
        sensorService.ingestReading(payload);
      }
    },
    publishControl(topic, message) {
      deviceService.recordOutgoingCommand(topic, message);
    },
  };
}

module.exports = { createMqttGateway };
