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
        next(error);
      }
    },
    async connectYoloBit(req, res, next) {
      try {
        const result = await deviceService.connectYoloBit(req.body || {});
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
    async disconnectYoloBit(req, res, next) {
      try {
        const result = await deviceService.disconnectYoloBit();
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
    async refreshSensors(req, res, next) {
      try {
        const result = await deviceService.refreshSensors();
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
    async setLeafState(req, res, next) {
      try {
        const result = await deviceService.setLeafState(req.body?.state);
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
    async sendRawSerial(req, res, next) {
      try {
        const result = await deviceService.sendRawSerial(req.body?.command);
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
    async setPump(req, res, next) {
      try {
        const result = await deviceService.setPump(Boolean(req.body?.enabled));
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createDeviceController };
