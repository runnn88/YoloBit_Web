import React, { useEffect, useMemo, useState, useRef } from "react";
import { fetchDevices, setPump1, setPump2, fetchSoilThresholds } from "../devices/deviceAPI";
import { SensorCard } from "../sensors/SensorCard";
import { fetchSensors } from "../sensors/sensorAPI";

function sensorMap(rows) {
  return rows.reduce((accumulator, sensor) => {
    accumulator[sensor.metric] = sensor.value;
    return accumulator;
  }, {});
}

<<<<<<< Updated upstream
function formatNumber(value, digits = 1) {
  if (typeof temp !== "number" || !Number.isFinite(temp)) {
    return "--";
=======
const DEFAULT_SOIL_GAUGE_THRESHOLDS = {
  danger: 5,
  warn: 10,
};

function formatNumber(value, digits = 1, valueIfInvalid = "--") {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return valueIfInvalid;
>>>>>>> Stashed changes
  }
  return value.toFixed(digits);
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

<<<<<<< Updated upstream
function computeGdd(temp) {
  // if (typeof temp !== "number" || !Number.isFinite(temp)) {
  //   return "--";
  // }
  // return Math.max(temp - 10, 0).toFixed(1);
  return formatNumber(Math.max(temp - 10, 0), 1);
}

function soilGaugeTone(soil) {
  if (typeof soil !== "number" || !Number.isFinite(soil)) {
    return "quiet";
  }
  if (soil < 30) {
    return "danger";
  }
  if (soil < 60) {
=======
function soilGaugeTone(soil, thresholds) {
  if (typeof soil !== "number" || !Number.isFinite(soil)) {
    return "quiet";
  }
  const { danger, warn } = thresholds;
  if (soil < danger) {
    return "danger";
  }
  if (soil < warn) {
>>>>>>> Stashed changes
    return "warn";
  }
  return "good";
}

<<<<<<< Updated upstream
=======
function getSoilGaugeGradient(thresholds) {
  const { danger, warn } = thresholds;
  return `linear-gradient(90deg, #d9534f 0%, #d9534f ${danger}%, #f0ad4e ${danger}%, #f0ad4e ${warn}%, #5cb85c ${warn}%, #5cb85c 100%)`;
}

>>>>>>> Stashed changes
function LineChart({ data, maxValue, width = 300, height = 100 }) {
  if (!data || data.length < 1) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;
  }

  const points = data.map((point, index) => {
    const x = (data.length === 1 ? width / 2 : (index / (data.length - 1)) * width);
    const y = height - ((typeof point.value === 'number' ? point.value : 0) / maxValue) * height;
    return { x, y };
  });

  const polylinePoints = points.length > 1 ? points.map((p) => `${p.x},${p.y}`).join(' ') : "";

  return (
    <svg width={width} height={height} style={{ border: '1px solid #e6ece7', borderRadius: '8px' }}>
      {polylinePoints ? (
        <polyline
          fill="none"
          stroke="#8dbfc7"
          strokeWidth="2"
          points={polylinePoints}
        />
      ) : null}
      {points.map((point, index) => (
        <circle
          key={`point-${index}`}
          cx={point.x}
          cy={point.y}
          r="3"
          fill="#8dbfc7"
          stroke="#ffffff"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function Dashboard() {
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState({});
  const [soilThresholds, setSoilThresholds] = useState(DEFAULT_SOIL_GAUGE_THRESHOLDS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [pumpBusy, setPumpBusy] = useState({});
  const [sensorHistory, setSensorHistory] = useState({
    soil: [{ time: Date.now() - 3000, value: 100 }, { time: Date.now(), value: 100 }],
    lux: [],
  });
  const [soilTrend, setSoilTrend] = useState(null);
  const prevSoilRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrateDashboard() {
      try {
        const [sensorRows, deviceRows, thresholdRows] = await Promise.all([
          fetchSensors(),
          fetchDevices(),
          fetchSoilThresholds(),
        ]);
        if (!cancelled) {
          setSensors(sensorRows || []);
          setDevices(deviceRows || {});
          setSoilThresholds(thresholdRows || DEFAULT_SOIL_GAUGE_THRESHOLDS);
          setErrorMessage("");

          // Update sensor history
          const now = Date.now();
          setSensorHistory(prev => ({
            soil: [...prev.soil, { time: now, value: sensorRows?.find(s => s.metric === 'soil')?.value }].slice(-20),
            lux: [...prev.lux, { time: now, value: sensorRows?.find(s => s.metric === 'lux')?.value }].slice(-20),
          }));
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

  useEffect(() => {
    if (typeof soil === "number" && prevSoilRef.current !== null) {
      if (soil > prevSoilRef.current) {
        setSoilTrend("up");
      } else if (soil < prevSoilRef.current) {
        setSoilTrend("down");
      }
      const timeout = setTimeout(() => setSoilTrend(null), 1500);
      return () => clearTimeout(timeout);
    }
    if (typeof soil === "number") {
      prevSoilRef.current = soil;
    }
  }, [soil]);
  const plantStatus = computePlantStatus(temp, humidity, soil);
  const gdd = computeGdd(temp);
  const yoloBitDevice = devices["yolobit-001"];
  const pump1Device = devices["pump-001"];
  const pump2Device = devices["pump-002"];

  async function handlePumpToggle(pumpId, setPumpFunc) {
    if (pumpBusy[pumpId]) return;

    try {
      setPumpBusy(prev => ({ ...prev, [pumpId]: true }));
      const device = devices[pumpId];
      const nextState = await setPumpFunc(!Boolean(device?.desiredEnabled));
      setDevices(prev => ({ ...prev, [pumpId]: nextState }));
    } catch (error) {
      setErrorMessage(error.message || String(error));
    } finally {
      setPumpBusy(prev => ({ ...prev, [pumpId]: false }));
    }
  }

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
            Board: {yoloBitDevice?.connected ? "On" : "Off"}
          </span>
          <span className="mode-pill subtle">Water Pumping: {pump1Device?.wateringMode === "automatic" ? "Auto" : "Manual"}</span>
        </div>
      </section>

      {errorMessage ? <p className="status-banner error">{errorMessage}</p> : null}
      {isLoading ? <p className="status-banner">Loading dashboard data...</p> : null}
      {!isLoading && yoloBitDevice?.sensorError ? <p className="status-banner error">{yoloBitDevice.sensorError}</p> : null}

      <section className="dashboard-top-grid">
        <SensorCard eyebrow="V1" title="Temperature" unit="°C" value={formatNumber(temp)} />
        <SensorCard eyebrow="V2" title="Humidity" unit="%" value={formatNumber(humidity, 0)} />
        <SensorCard eyebrow="V6" title="Plant Status" value={plantStatus} />
        <SensorCard eyebrow="V5" title="GDD" value={gdd} />

        <SensorCard eyebrow="V3" title="Soil Moisture" unit="%" value={typeof soil === "number" ? `${Math.round(soil)}%` : "--"}>
          <div style={{ position: 'relative', paddingTop: '20px' }}>
<<<<<<< Updated upstream
            <div className="mini-bar" style={{ background: 'linear-gradient(90deg, #d9534f 0%, #d9534f 33%, #f0ad4e 33%, #f0ad4e 66%, #5cb85c 66%, #5cb85c 100%)' }}>
              <span style={{ width: `${typeof soil === "number" ? Math.max(0, Math.min(100, soil)) : 0}%`, backgroundColor: '#2c3e50', opacity: 0.6 }} />
=======
            <div className="mini-bar" style={{ background: getSoilGaugeGradient(soilThresholds) }}>
>>>>>>> Stashed changes
            </div>
            <span style={{ 
              position: 'absolute', 
              left: `${typeof soil === "number" ? Math.max(0, Math.min(100, soil)) : 0}%`,
              top: '0px',
              transform: 'translateX(-50%)',
              fontSize: '24px',
              fontWeight: 'bold',
              color: soilTrend === 'up' ? '#5cb85c' : soilTrend === 'down' ? '#d9534f' : '#2c3e50',
              transition: 'all 0.3s ease'
            }}>
              ▼
            </span>
          </div>
        </SensorCard>

        <SensorCard eyebrow="V4" title="Lux" value={typeof lux === "number" ? lux : "--"}>
          <div className="mini-bar">
            <span style={{ width: `${typeof lux === "number" ? Math.min(100, (lux / 4095) * 100) : 0}%`, backgroundColor: '#4e6a65' }} />
          </div>
        </SensorCard>

        <article className="panel-card pump-control-card">
          <div className="panel-head">
            <div>
              <p className="sensor-eyebrow">V10</p>
              <h3>Pump 1</h3>
            </div>
            <span className={pump1Device?.desiredEnabled ? "mode-pill live" : "mode-pill idle"}>
              {pump1Device?.desiredEnabled ? "On" : "Off"}
            </span>
          </div>
        </article>

        <article className="panel-card pump-control-card">
          <div className="panel-head">
            <div>
              <p className="sensor-eyebrow">V11</p>
              <h3>Pump 2</h3>
            </div>
            <span className={pump2Device?.desiredEnabled ? "mode-pill live" : "mode-pill idle"}>
              {pump2Device?.desiredEnabled ? "On" : "Off"}
            </span>
          </div>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="panel-card history-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Live Feed Chart</p>
              <h3>Soil Moisture</h3>
            </div>
            <span className="mode-pill subtle">V3</span>
          </div>
          <p className="panel-value">{typeof soil === "number" ? `${soil.toFixed(1)}%` : "--"}</p>
          <p className="panel-copy">Current soil moisture translated by the backend from the analog sensor feed.</p>
          <LineChart data={sensorHistory.soil} maxValue={100} />
        </article>

        <article className="panel-card history-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Live Feed Chart</p>
              <h3>Lux</h3>
            </div>
            <span className="mode-pill subtle">V4</span>
          </div>
          <p className="panel-value">{typeof lux === "number" ? lux : "--"}</p>
          <p className="panel-copy">Current light sensor reading from the Yolo:Bit backend stream.</p>
          <LineChart data={sensorHistory.lux} maxValue={4095} />
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
