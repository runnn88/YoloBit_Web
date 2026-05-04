import React, { useEffect, useState } from "react";
import { fetchDevices } from "../devices/deviceAPI";
import { fetchBackendHealth } from "../../services/api";
import { usePolling } from "../../shared/hooks/usePolling";
import { UsbSerialPanel } from "./UsbSerialPanel";
import { useYoloBitUsb } from "./YoloBitUsbContext";

function StatusPill({ label, tone }) {
  return <span className={`status-pill status-pill-${tone}`}>{label}</span>;
}

export function ConnectionPage() {
  const [backendOk, setBackendOk] = useState(false);
  const [pumpDevice, setPumpDevice] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { baudRate, isConnected, statusMessage } = useYoloBitUsb();

  async function refreshStatus() {
    try {
      const [health, devices] = await Promise.all([
        fetchBackendHealth(),
        fetchDevices(),
      ]);

      setBackendOk(Boolean(health?.ok));
      setPumpDevice(devices["pump-001"] || null);
      setLastCheckedAt(new Date().toLocaleTimeString());
      setErrorMessage("");
    } catch (error) {
      setBackendOk(false);
      setPumpDevice(null);
      setLastCheckedAt(new Date().toLocaleTimeString());
      setErrorMessage("The frontend could not reach the backend. Start the backend before checking YoloBit connectivity.");
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  usePolling(refreshStatus, 5000);

  const backendConnected = Boolean(pumpDevice?.connected);
  const connected = backendConnected || isConnected;
  const desiredEnabled = Boolean(pumpDevice?.desiredEnabled);
  const reportedEnabled = Boolean(pumpDevice?.reportedEnabled);

  return (
    <main className="dashboard">
      <header className="hero">
        <p className="eyebrow">Connection Check</p>
        <h1>YoloBit Connection Status</h1>
        <p className="hero-copy">
          This page checks whether the backend is online and whether the dashboard has received confirmed device
          telemetry from the YoloBit.
        </p>
      </header>

      {errorMessage ? <p className="status-banner error">{errorMessage}</p> : null}

      <section className="setup-grid">
        <article className="setup-card">
          <h3>Backend API</h3>
          <p>
            Status: <StatusPill label={backendOk ? "Reachable" : "Offline"} tone={backendOk ? "ok" : "warn"} />
          </p>
          <p>Health endpoint: <code>/health</code></p>
          <p>Last checked: {lastCheckedAt || "Checking..."}</p>
        </article>

        <article className="setup-card">
          <h3>YoloBit device</h3>
          <p>
            Status:{" "}
            <StatusPill
              label={connected ? "Connected" : "Not connected"}
              tone={connected ? "ok" : "warn"}
            />
          </p>
          <p>USB link: <code>{statusMessage}</code></p>
          <p>USB baud rate: <code>{baudRate}</code></p>
          <p>Connection source: <code>{isConnected ? "browser-usb" : pumpDevice?.transport || "backend-only"}</code></p>
          <p>Desired pump state: {desiredEnabled ? "ON" : "OFF"}</p>
          <p>Confirmed pump state: {reportedEnabled ? "Running" : "Not confirmed"}</p>
          <p>Backend device status: <code>{pumpDevice?.status || "offline"}</code></p>
        </article>
      </section>

      <section className="setup-guide">
        <div className="setup-guide-header">
          <h2>What counts as connected?</h2>
          <p>
            The YoloBit should only appear connected after the backend receives real MQTT/device telemetry. Until that
            is wired in, this page is useful for checking whether the backend is alive and whether the app has any
            confirmed device state.
          </p>
        </div>
      </section>

      <UsbSerialPanel />
    </main>
  );
}
