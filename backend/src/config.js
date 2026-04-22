module.exports = {
  port: process.env.PORT || 4000,
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883",
  },
};
