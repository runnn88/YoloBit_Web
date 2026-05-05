import React, { useEffect, useState } from "react";
import { PumpControl } from "../devices/PumpControl";
import { ConnectionGuide } from "../setup/ConnectionGuide";
import { fetchDevices, setPump } from "../devices/deviceAPI";
import { SensorCard } from "../sensors/SensorCard";
import { fetchSensors } from "../sensors/sensorAPI";

function metricUnit(metric) {
  if (metric === "temp") {
    return "C";
  }
  if (metric === "humidity" || metric === "soil") {
    return "%";
  }
  return "";
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
          setErrorMessage(
            "The dashboard loaded, but live data could not be fetched. Make sure the backend is running and the Yolo:Bit is connected from the connection page.",
          );
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

  async function handlePumpToggle() {
    const current = Boolean(devices["pump-001"]?.desiredEnabled);
    try {
      const nextState = await setPump(!current);
      setDevices((prev) => ({
        ...prev,
        "pump-001": nextState,
      }));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Pump control failed because the backend request did not complete.");
    }
  }

  const yoloBitDevice = devices["yolobit-001"];

  return (
    <main className="dashboard">
      <header className="hero">
        <p className="eyebrow">Smart Farm Dashboard</p>
        <h1>Yolo:Bit Control Board</h1>
        <p className="hero-copy">
          This page shows backend-fetched Yolo:Bit sensor readings and pump control state. Connect the board from the
          connection page first, then the dashboard will refresh automatically.
        </p>
      </header>

      {errorMessage ? <p className="status-banner error">{errorMessage}</p> : null}
      {isLoading ? <p className="status-banner">Loading dashboard data...</p> : null}
      {!isLoading && yoloBitDevice?.sensorError ? (
        <p className="status-banner error">Latest board error: {yoloBitDevice.sensorError}</p>
      ) : null}
      {!isLoading && yoloBitDevice?.connected ? (
        <p className="status-banner">
          Yolo:Bit connected on {yoloBitDevice.serialPath || "serial"}. Last sensor read: {yoloBitDevice.lastSensorReadAt || "waiting"}.
        </p>
      ) : null}

      <section className="sensor-grid">
        {sensors.length ? (
          sensors.map((sensor) => (
            <SensorCard
              key={`${sensor.deviceId}-${sensor.metric}`}
              title={sensor.metric.toUpperCase()}
              value={sensor.value}
              unit={metricUnit(sensor.metric)}
            />
          ))
        ) : (
          <article className="sensor-card sensor-card-empty">
            <h3>No sensor readings yet</h3>
            <p>Connect the Yolo:Bit from the connection page and wait for the backend to receive live serial sensor data.</p>
          </article>
        )}
      </section>

      <PumpControl device={devices["pump-001"]} onToggle={handlePumpToggle} />

      <ConnectionGuide />
    </main>
  );
}
