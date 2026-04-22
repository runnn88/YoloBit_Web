const config = require("./config");
const eventBus = require("./core/eventBus");
const { createMqttGateway } = require("./core/mqtt");
const { createServer } = require("./core/server");
const { SensorStore } = require("./domains/sensor/sensor.store");
const { SensorService } = require("./domains/sensor/sensor.service");
const { DeviceStore } = require("./domains/device/device.store");
const { DeviceService } = require("./domains/device/device.service");

const sensorStore = new SensorStore();
const deviceStore = new DeviceStore();

const sensorService = new SensorService({ store: sensorStore, eventBus });

const mqttGateway = createMqttGateway({
  sensorService,
  deviceService: {
    recordOutgoingCommand() {},
  },
});

const deviceService = new DeviceService({
  store: deviceStore,
  eventBus,
  mqttGateway,
});

mqttGateway.publishControl = (topic, message) => deviceService.recordOutgoingCommand(topic, message);

const app = createServer({ sensorService, deviceService });

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
