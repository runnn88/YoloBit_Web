import React, { useEffect, useMemo, useState } from "react";
import { fetchDevices } from "../devices/deviceAPI";
import { SensorCard } from "../sensors/SensorCard";
import { fetchSensors } from "../sensors/sensorAPI";

function sensorMap(rows) {
  return rows.reduce((accumulator, sensor) => {
    accumulator[sensor.metric] = sensor.value;
    return accumulator;
  }, {});
}

function formatNumber(value, digits = 1) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "--";
}

function computePlantStatus(temp, humidity, soil) {
  if (![temp, humidity, soil].every((value) => typeof value === "number" && Number.isFinite(value))) {
    return "Awaiting data";
  }
  if (soil < 25) {
    return "Dry soil";
  }
  if (temp > 35) {
    return "Heat stress";
  }
  if (humidity < 35) {
    return "Low humidity";
  }
  return "Healthy";
}

function computeGdd(temp) {
  if (typeof temp !== "number" || !Number.isFinite(temp)) {
    return "--";
  }
  return Math.max(temp - 10, 0).toFixed(1);
}

function soilGaugeTone(soil) {
  if (typeof soil !== "number" || !Number.isFinite(soil)) {
    return "quiet";
  }
  if (soil < 30) {
    return "danger";
  }
  if (soil < 60) {
    return "warn";
  }
  return "good";
}

export function Dashboard() {
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function hydrateDashboard() {
      try {
        const [sensorRows, deviceRows] = await Promise.all([fetchSensors(), fetchDevices()]);
        if (!cancelled) {
          setSensors(sensorRows || []);
          setDevices(deviceRows || {});
          setErrorMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage("The dashboard could not fetch live Yolo:Bit data. Check the backend and board connection.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    hydrateDashboard();
    const timer = window.setInterval(hydrateDashboard, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const metrics = useMemo(() => sensorMap(sensors), [sensors]);
  const temp = metrics.temp;
  const humidity = metrics.humidity;
  const soil = metrics.soil;
  const lux = metrics.lux;
  const plantStatus = computePlantStatus(temp, humidity, soil);
  const gdd = computeGdd(temp);
  const yoloBitDevice = devices["yolobit-001"];
  const pumpDevice = devices["pump-001"];

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="hero-kicker">Live Overview</p>
          <h2 className="hero-title">Farm conditions at a glance</h2>
          <p className="hero-copy">
            The dashboard refreshes from the backend every 3 seconds and reflects the live Yolo:Bit serial feed.
          </p>
        </div>
        <div className="hero-badges">
          <span className={yoloBitDevice?.connected ? "mode-pill live" : "mode-pill idle"}>
            {yoloBitDevice?.connected ? "Board Connected" : "Board Offline"}
          </span>
          <span className="mode-pill subtle">Mode: {pumpDevice?.wateringMode || "manual"}</span>
        </div>
      </section>

      {errorMessage ? <p className="status-banner error">{errorMessage}</p> : null}
      {isLoading ? <p className="status-banner">Loading dashboard data...</p> : null}
      {!isLoading && yoloBitDevice?.sensorError ? <p className="status-banner error">{yoloBitDevice.sensorError}</p> : null}

      <section className="dashboard-top-grid">
        <SensorCard eyebrow="V1" title="Temperature" tone="red" unit="°C" value={formatNumber(temp)} />
        <SensorCard eyebrow="V2" title="Humidity" tone="blue" unit="%" value={formatNumber(humidity, 0)} />
        <SensorCard eyebrow="V6" title="Plant Status" tone="amber" value={plantStatus} />
        <SensorCard eyebrow="V5" title="GDD" tone="green" value={gdd} />

        <article className="soil-gauge-card">
          <p className="sensor-eyebrow">V3</p>
          <h3>Soil Moisture</h3>
          <div className={`soil-gauge soil-gauge-${soilGaugeTone(soil)}`}>
            <div className="soil-gauge-track" />
            <div className="soil-gauge-needle" style={{ transform: `rotate(${typeof soil === "number" ? -90 + (soil / 100) * 180 : -90}deg)` }} />
            <div className="soil-gauge-center">{typeof soil === "number" ? `${Math.round(soil)}%` : "--"}</div>
          </div>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="panel-card history-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Live Feed</p>
              <h3>Light Snapshot</h3>
            </div>
            <span className="mode-pill subtle">V4</span>
          </div>
          <p className="panel-value">{typeof lux === "number" ? lux : "--"}</p>
          <p className="panel-copy">Current light sensor reading from the Yolo:Bit backend stream.</p>
          <div className="mini-bar">
            <span style={{ width: `${typeof lux === "number" ? Math.min(100, (lux / 4095) * 100) : 0}%` }} />
          </div>
        </article>

        <article className="panel-card history-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Live Feed</p>
              <h3>Soil Snapshot</h3>
            </div>
            <span className="mode-pill subtle">V3</span>
          </div>
          <p className="panel-value">{typeof soil === "number" ? `${soil.toFixed(1)}%` : "--"}</p>
          <p className="panel-copy">Current soil moisture translated by the backend from the analog sensor feed.</p>
          <div className="mini-bar">
            <span style={{ width: `${typeof soil === "number" ? Math.max(0, Math.min(100, soil)) : 0}%` }} />
          </div>
        </article>

        <article className="panel-card device-summary-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Device Link</p>
              <h3>Backend Serial Status</h3>
            </div>
            <span className={yoloBitDevice?.connected ? "mode-pill live" : "mode-pill idle"}>{yoloBitDevice?.status || "offline"}</span>
          </div>
          <p className="panel-copy">Port: <code>{yoloBitDevice?.serialPath || "not connected"}</code></p>
          <p className="panel-copy">Last sensor read: <code>{yoloBitDevice?.lastSensorReadAt || "waiting"}</code></p>
          <p className="panel-copy">Last message: <code>{yoloBitDevice?.lastSerialMessage || "waiting"}</code></p>
        </article>
      </section>
    </main>
  );
}
