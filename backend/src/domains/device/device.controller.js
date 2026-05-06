function logDeviceError(action, error, details = {}) {
  console.error(`[device-controller] ${action} failed`, {
    message: error?.message || String(error),
    stack: error?.stack,
    ...details,
  });
}

function createDeviceController(deviceService) {
  return {
    list(req, res) {
      res.json(deviceService.listState());
    },
    async listPorts(req, res, next) {
      try {
        const result = await deviceService.listSerialPorts();
        res.json(result);
      } catch (error) {
        logDeviceError("listPorts", error);
        next(error);
      }
    },
    async connectYoloBit(req, res, next) {
      try {
        const result = await deviceService.connectYoloBit(req.body || {});
        res.json(result);
      } catch (error) {
        logDeviceError("connectYoloBit", error, { body: req.body || {} });
        next(error);
      }
    },
    async disconnectYoloBit(req, res, next) {
      try {
        const result = await deviceService.disconnectYoloBit();
        res.json(result);
      } catch (error) {
        logDeviceError("disconnectYoloBit", error);
        next(error);
      }
    },
    async refreshSensors(req, res, next) {
      try {
        const result = await deviceService.refreshSensors();
        res.json(result);
      } catch (error) {
        logDeviceError("refreshSensors", error);
        next(error);
      }
    },
    async setLeafState(req, res, next) {
      try {
        const result = await deviceService.setLeafState(req.body?.state);
        res.json(result);
      } catch (error) {
        logDeviceError("setLeafState", error, { body: req.body || {} });
        next(error);
      }
    },
    async sendRawSerial(req, res, next) {
      try {
        const result = await deviceService.sendRawSerial(req.body?.command);
        res.json(result);
      } catch (error) {
        logDeviceError("sendRawSerial", error, { body: req.body || {} });
        next(error);
      }
    },
    async setPump(req, res, next) {
      try {
        const result = await deviceService.setPump(Boolean(req.body?.enabled));
        res.json(result);
      } catch (error) {
        logDeviceError("setPump", error, { body: req.body || {} });
        next(error);
      }
    },
    async setPump1(req, res, next) {
      try {
        const result = await deviceService.setPump1(Boolean(req.body?.enabled));
        res.json(result);
      } catch (error) {
        logDeviceError("setPump1", error, { body: req.body || {} });
        next(error);
      }
    },
    async setPump2(req, res, next) {
      try {
        const result = await deviceService.setPump2(Boolean(req.body?.enabled));
        res.json(result);
      } catch (error) {
        logDeviceError("setPump2", error, { body: req.body || {} });
        next(error);
      }
    },
    setWateringMode(req, res, next) {
      try {
        const result = deviceService.setWateringMode(req.body?.mode);
        res.json(result);
      } catch (error) {
        logDeviceError("setWateringMode", error, { body: req.body || {} });
        next(error);
      }
    },
  };
}

module.exports = { createDeviceController };
