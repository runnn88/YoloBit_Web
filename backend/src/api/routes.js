const express = require("express");
const { createSensorController } = require("../domains/sensor/sensor.controller");
const { createDeviceController } = require("../domains/device/device.controller");

module.exports = function routes({ sensorService, deviceService }) {
  const router = express.Router();
  const sensorController = createSensorController(sensorService);
  const deviceController = createDeviceController(deviceService);

  router.get("/sensors", sensorController.list);
  router.get("/devices", deviceController.list);
  router.get("/devices/ports", deviceController.listPorts);
  router.post("/devices/pump", deviceController.setPump);
  router.post("/devices/pump1", deviceController.setPump1);
  router.post("/devices/pump2", deviceController.setPump2);
  router.get("/devices/thresholds", deviceController.listThresholds);
  router.post("/devices/thresholds", deviceController.setThresholds);
  router.post("/devices/watering-mode", deviceController.setWateringMode);
  router.post("/devices/yolobit/connect", deviceController.connectYoloBit);
  router.post("/devices/yolobit/disconnect", deviceController.disconnectYoloBit);
  router.post("/devices/yolobit/refresh", deviceController.refreshSensors);
  router.post("/devices/yolobit/leaf", deviceController.setLeafState);
  router.post("/devices/yolobit/serial", deviceController.sendRawSerial);

  return router;
};
