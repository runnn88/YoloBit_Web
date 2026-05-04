import React, { useEffect, useState } from "react";
import { PumpControl } from "../devices/PumpControl";
import { YoloBitUsbControl } from "../devices/YoloBitUsbControl";
import { ConnectionGuide } from "../setup/ConnectionGuide";
import { fetchDevices, setPump } from "../devices/deviceAPI";
import { SensorCard } from "../sensors/SensorCard";
import { loadSensors } from "../sensors/sensorSlice";

export function Dashboard() {
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function hydrateDashboard() {
      try {
        await Promise.all([
          loadSensors(setSensors),
          fetchDevices().then(setDevices),
        ]);
      } catch (error) {
        setErrorMessage(
          "The dashboard loaded, but live data could not be fetched. Make sure the backend is running on http://localhost:4000.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    hydrateDashboard();
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

  return (
    <main className="dashboard">
      <header className="hero">
        <p className="eyebrow">Smart Farm Dashboard</p>
        <h1>YoloBit UNO Control Center</h1>
        <p className="hero-copy">
          Sensor readings and irrigation controls will appear here as soon as the API is reachable.
        </p>
      </header>

      {errorMessage ? <p className="status-banner error">{errorMessage}</p> : null}
      {isLoading ? <p className="status-banner">Loading dashboard data...</p> : null}

      <section className="sensor-grid">
        {sensors.length ? (
          sensors.map((sensor) => (
            <SensorCard
              key={`${sensor.deviceId}-${sensor.metric}`}
              title={sensor.metric.toUpperCase()}
              value={sensor.value}
              unit={sensor.metric === "temp" ? "C" : "%"}
            />
          ))
        ) : (
          <article className="sensor-card sensor-card-empty">
            <h3>No sensor readings yet</h3>
            <p>Start the device publisher or seed data through the backend to populate this panel.</p>
          </article>
        )}
      </section>

      <PumpControl
        device={devices["pump-001"]}
        onToggle={handlePumpToggle}
      />

      <YoloBitUsbControl />

      <ConnectionGuide />
    </main>
  );
}
