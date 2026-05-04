module.exports = {
  port: process.env.PORT || 4000,
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883",
  },
  serial: {
    defaultPath: process.env.YOLOBIT_SERIAL_PATH || "",
    defaultBaudRate: Number(process.env.YOLOBIT_BAUD_RATE || 115200),
  },
};
