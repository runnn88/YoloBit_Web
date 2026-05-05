module.exports = {
  port: process.env.PORT || 4000,
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883',
  },
  serial: {
    defaultPath: process.env.YOLOBIT_SERIAL_PATH || '',
    defaultBaudRate: Number(process.env.YOLOBIT_BAUD_RATE || 115200),
    startupDelayMs: Number(process.env.YOLOBIT_STARTUP_DELAY_MS || 1200),
    pollIntervalMs: Number(process.env.YOLOBIT_SENSOR_POLL_INTERVAL_MS || 3000),
    commandSpacingMs: Number(process.env.YOLOBIT_COMMAND_SPACING_MS || 200),
  },
  pump: {
    pinName: process.env.YOLOBIT_PUMP_PIN || 'pin10',
    onValue: Number(process.env.YOLOBIT_PUMP_ON_VALUE || 1),
    offValue: Number(process.env.YOLOBIT_PUMP_OFF_VALUE || 0),
  },
};
