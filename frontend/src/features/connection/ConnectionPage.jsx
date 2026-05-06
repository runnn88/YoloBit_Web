import React, { useEffect, useState } from "react";
import {
  connectYoloBit,
  disconnectYoloBit,
  fetchDevices,
  fetchYoloBitPorts,
  refreshYoloBitSensors,
} from "../devices/deviceAPI";
import { fetchBackendHealth } from "../../services/api";

function StatusPill({ label, tone }) {
  return <span className={`status-pill status-pill-${tone}`}>{label}</span>;
}

export function ConnectionPage() {
  const [backendOk, setBackendOk] = useState(false);
  const [devices, setDevices] = useState({});
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [baudRate, setBaudRate] = useState("115200");
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");

  async function refreshStatus() {
    try {
      const [health, deviceRows, portRows] = await Promise.all([fetchBackendHealth(), fetchDevices(), fetchYoloBitPorts()]);
      setBackendOk(Boolean(health?.ok));
      setDevices(deviceRows || {});
      setPorts(portRows || []);
      if (!selectedPort && portRows?.length) {
        setSelectedPort(portRows[0].path);
      }
      setLastCheckedAt(new Date().toLocaleTimeString());
      setErrorMessage("");
    } catch (error) {
      setBackendOk(false);
      setLastCheckedAt(new Date().toLocaleTimeString());
      setErrorMessage("The frontend could not reach the backend. Start the backend before checking Yolo:Bit connectivity.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!cancelled) {
        await refreshStatus();
      }
    }

    hydrate();
    const timer = window.setInterval(hydrate, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedPort]);

  async function handleConnect() {
    try {
      setBusyAction("connect");
      await connectYoloBit({ path: selectedPort, baudRate: Number(baudRate) || 115200 });
      await refreshStatus();
    } catch (error) {
      setErrorMessage(error.message || String(error));
    } finally {
      setBusyAction("");
    }
  }

  async function handleDisconnect() {
    try {
      setBusyAction("disconnect");
      await disconnectYoloBit();
      await refreshStatus();
    } catch (error) {
      setErrorMessage(error.message || String(error));
    } finally {
      setBusyAction("");
    }
  }

  async function handleRefreshSensors() {
    try {
      setBusyAction("refresh");
      await refreshYoloBitSensors();
      window.setTimeout(refreshStatus, 500);
    } catch (error) {
      setErrorMessage(error.message || String(error));
    } finally {
      setBusyAction("");
    }
  }

  const yoloBitDevice = devices["yolobit-001"] || null;

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="hero-kicker">Connection Check</p>
          <h2 className="hero-title">Bind the backend to the Yolo:Bit</h2>
          <p className="hero-copy">The frontend never talks to the board directly. All live data and control flow through the backend serial connection.</p>
        </div>
        <div className="hero-badges">
          <span className={backendOk ? "mode-pill live" : "mode-pill idle"}>{backendOk ? "Backend Ready" : "Backend Offline"}</span>
          <span className={yoloBitDevice?.connected ? "mode-pill live" : "mode-pill idle"}>{yoloBitDevice?.connected ? "Board Connected" : "Board Offline"}</span>
        </div>
      </section>

      {errorMessage ? <p className="status-banner error">{errorMessage}</p> : null}

      <section className="dashboard-bottom-grid">
        <article className="panel-card">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Backend Port</p>
              <h3>Serial Port Selection</h3>
            </div>
            <span className="mode-pill subtle">USB</span>
          </div>

          <label className="field-label" htmlFor="serial-port-select">Port</label>
          <select className="text-input" id="serial-port-select" onChange={(event) => setSelectedPort(event.target.value)} value={selectedPort}>
            <option value="">Choose a COM port</option>
            {ports.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path} {port.friendlyName ? `- ${port.friendlyName}` : ""}
              </option>
            ))}
          </select>

          <label className="field-label" htmlFor="serial-baud-rate">Baud rate</label>
          <select className="text-input" id="serial-baud-rate" onChange={(event) => setBaudRate(event.target.value)} value={baudRate}>
            <option value="9600">9600</option>
            <option value="19200">19200</option>
            <option value="38400">38400</option>
            <option value="57600">57600</option>
            <option value="115200">115200</option>
          </select>
          <p className="field-help">
            Baud rate determines the speed of serial communication in bits per second. Higher rates allow faster data transfer but require reliable connections. 
            Bit time = 1 / baud rate seconds. For {baudRate} baud: { (1000000 / Number(baudRate)).toFixed(1) } μs per bit.
          </p>

          <div className="connection-actions">
            <button className="primary-action" disabled={!selectedPort || busyAction !== "" || yoloBitDevice?.connected} onClick={handleConnect} type="button">
              {busyAction === "connect" ? "Connecting..." : "Connect"}
            </button>
            <button className="secondary-action" disabled={busyAction !== "" || !yoloBitDevice?.connected} onClick={handleDisconnect} type="button">
              {busyAction === "disconnect" ? "Disconnecting..." : "Disconnect"}
            </button>
            <button className="secondary-action" disabled={busyAction !== "" || !yoloBitDevice?.connected} onClick={handleRefreshSensors} type="button">
              {busyAction === "refresh" ? "Refreshing..." : "Refresh Sensors"}
            </button>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Live Serial State</p>
              <h3>Board Diagnostics</h3>
            </div>
            <StatusPill label={yoloBitDevice?.connected ? "Connected" : "Waiting"} tone={yoloBitDevice?.connected ? "ok" : "warn"} />
          </div>

          <p className="panel-copy">Last checked: <code>{lastCheckedAt || "Checking..."}</code></p>
          <p className="panel-copy">Serial path: <code>{yoloBitDevice?.serialPath || "not connected"}</code></p>
          <p className="panel-copy">Baud rate: <code>{yoloBitDevice?.baudRate || baudRate}</code></p>
          <p className="panel-copy">Backend status: <code>{yoloBitDevice?.status || "offline"}</code></p>
          <p className="panel-copy">Last serial message: <code>{yoloBitDevice?.lastSerialMessage || "waiting"}</code></p>
          <p className="panel-copy">Last sensor read: <code>{yoloBitDevice?.lastSensorReadAt || "waiting"}</code></p>
          <p className="panel-copy">Sensor error: <code>{yoloBitDevice?.sensorError || "none"}</code></p>
        </article>
      </section>
    </main>
  );
}
