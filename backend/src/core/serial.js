const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

function formatPortInfo(port) {
  return {
    path: port.path,
    manufacturer: port.manufacturer || "",
    friendlyName: port.friendlyName || "",
    serialNumber: port.serialNumber || "",
    vendorId: port.vendorId || "",
    productId: port.productId || "",
  };
}

function createSerialGateway({ onConnected, onDisconnected, onData, onError }) {
  let activePort = null;
  let activeParser = null;
  let connectionInfo = {
    connected: false,
    path: "",
    baudRate: null,
  };

  async function listPorts() {
    const ports = await SerialPort.list();
    return ports.map(formatPortInfo);
  }

  async function connect({ path, baudRate }) {
    if (!path) {
      throw new Error("A serial port path is required.");
    }

    if (activePort?.isOpen) {
      await disconnect();
    }

    const port = new SerialPort({
      path,
      baudRate,
      autoOpen: false,
    });

    await new Promise((resolve, reject) => {
      port.open((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

    parser.on("data", (line) => {
      if (typeof onData === "function") {
        onData(line);
      }
    });

    port.on("close", () => {
      connectionInfo = {
        connected: false,
        path: "",
        baudRate: null,
      };
      activePort = null;
      activeParser = null;

      if (typeof onDisconnected === "function") {
        onDisconnected();
      }
    });

    port.on("error", (error) => {
      if (typeof onError === "function") {
        onError(error);
      }
    });

    activePort = port;
    activeParser = parser;
    connectionInfo = {
      connected: true,
      path,
      baudRate,
    };

    if (typeof onConnected === "function") {
      onConnected(connectionInfo);
    }

    return connectionInfo;
  }

  async function disconnect() {
    if (!activePort) {
      return {
        connected: false,
        path: "",
        baudRate: null,
      };
    }

    if (activeParser) {
      activeParser.removeAllListeners("data");
      activeParser = null;
    }

    const port = activePort;
    activePort = null;

    await new Promise((resolve, reject) => {
      port.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    connectionInfo = {
      connected: false,
      path: "",
      baudRate: null,
    };

    return connectionInfo;
  }

  async function send(data) {
    if (!activePort?.isOpen) {
      throw new Error("No open serial connection to the YoloBit.");
    }

    await new Promise((resolve, reject) => {
      activePort.write(data, (error) => {
        if (error) {
          reject(error);
          return;
        }

        activePort.drain((drainError) => {
          if (drainError) {
            reject(drainError);
            return;
          }

          resolve();
        });
      });
    });
  }

  function getConnectionInfo() {
    return connectionInfo;
  }

  return {
    connect,
    disconnect,
    getConnectionInfo,
    listPorts,
    send,
  };
}

module.exports = { createSerialGateway };
