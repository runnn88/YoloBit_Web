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
      const [health, deviceRows, portRows] = await Promise.all([
        fetchBackendHealth(),
        fetchDevices(),
        fetchYoloBitPorts(),
      ]);

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
  const pumpDevice = devices["pump-001"] || null;
  const connected = Boolean(yoloBitDevice?.connected);
  const desiredEnabled = Boolean(pumpDevice?.desiredEnabled);
  const reportedEnabled = Boolean(pumpDevice?.reportedEnabled);

  return (
    <main className="dashboard">
      <header className="hero">
        <p className="eyebrow">Connection Check</p>
        <h1>Yolo:Bit Backend Connection</h1>
        <p className="hero-copy">
          This page controls the backend serial connection to the Yolo:Bit. The frontend does not talk to the board directly.
        </p>
      </header>

      {errorMessage ? <p className="status-banner error">{errorMessage}</p> : null}

      <section className="setup-grid">
        <article className="setup-card">
          <h3>Backend API</h3>
          <p>Status: <StatusPill label={backendOk ? "Reachable" : "Offline"} tone={backendOk ? "ok" : "warn"} /></p>
          <p>Health endpoint: <code>/health</code></p>
          <p>Last checked: {lastCheckedAt || "Checking..."}</p>
        </article>

        <article className="setup-card">
          <h3>Serial port</h3>
          <label className="field-label" htmlFor="serial-port-select">Port</label>
          <select
            className="text-input"
            id="serial-port-select"
            onChange={(event) => setSelectedPort(event.target.value)}
            value={selectedPort}
          >
            <option value="">Choose a COM port</option>
            {ports.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path} {port.friendlyName ? `- ${port.friendlyName}` : ""}
              </option>
            ))}
          </select>

          <label className="field-label" htmlFor="serial-baud-rate">Baud rate</label>
          <input
            className="text-input"
            id="serial-baud-rate"
            onChange={(event) => setBaudRate(event.target.value)}
            value={baudRate}
          />

          <div className="connection-actions">
            <button className="primary-action" disabled={!selectedPort || busyAction !== "" || connected} onClick={handleConnect} type="button">
              {busyAction === "connect" ? "Connecting..." : "Connect Backend USB"}
            </button>
            <button className="secondary-action" disabled={busyAction !== "" || !connected} onClick={handleDisconnect} type="button">
              {busyAction === "disconnect" ? "Disconnecting..." : "Disconnect"}
            </button>
            <button className="secondary-action" disabled={busyAction !== "" || !connected} onClick={handleRefreshSensors} type="button">
              {busyAction === "refresh" ? "Refreshing..." : "Refresh Sensors"}
            </button>
          </div>
        </article>
      </section>

      <section className="setup-grid">
        <article className="setup-card">
          <h3>Yolo:Bit device</h3>
          <p>Status: <StatusPill label={connected ? "Connected" : "Not connected"} tone={connected ? "ok" : "warn"} /></p>
          <p>Serial path: <code>{yoloBitDevice?.serialPath || "waiting"}</code></p>
          <p>Baud rate: <code>{yoloBitDevice?.baudRate || baudRate}</code></p>
          <p>Backend status: <code>{yoloBitDevice?.status || "offline"}</code></p>
          <p>Last serial message: <code>{yoloBitDevice?.lastSerialMessage || "Waiting"}</code></p>
          <p>Last sensor read: <code>{yoloBitDevice?.lastSensorReadAt || "Waiting"}</code></p>
          <p>Sensor error: <code>{yoloBitDevice?.sensorError || "None"}</code></p>
        </article>

        <article className="setup-card">
          <h3>Pump state</h3>
          <p>Desired pump state: {desiredEnabled ? "ON" : "OFF"}</p>
          <p>Confirmed pump state: {reportedEnabled ? "Running" : "Stopped"}</p>
          <p>Pump backend status: <code>{pumpDevice?.status || "offline"}</code></p>
        </article>
      </section>
    </main>
  );
}
