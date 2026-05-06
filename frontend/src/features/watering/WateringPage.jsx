import React, { useEffect, useRef, useState } from "react";
import { fetchDevices, setPump1, setPump2, setWateringMode } from "../devices/deviceAPI";

const PUMP_CLICK_COOLDOWN_MS = 3000;

export function WateringPage() {
  const [devices, setDevices] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [pumpCooldown, setPumpCooldown] = useState({});
  const cooldownTimerRef = useRef({});

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const nextDevices = await fetchDevices();
        if (!cancelled) {
          setDevices(nextDevices || {});
          setErrorMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage("Watering controls could not load from the backend.");
        }
      }
    }

    hydrate();
    const timer = window.setInterval(hydrate, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      Object.values(cooldownTimerRef.current).forEach(timer => window.clearTimeout(timer));
    };
  }, []);

  const pump1Device = devices["pump-001"] || {};
  const pump2Device = devices["pump-002"] || {};
  const yoloBitDevice = devices["yolobit-001"] || {};
  const isAutomatic = pump1Device.wateringMode === "automatic";
  const pump1Busy = busyAction === "pump1";
  const pump2Busy = busyAction === "pump2";
  const modeBusy = busyAction === "mode";
  const isConnected = yoloBitDevice.connected;

  function startPumpCooldown(pumpId) {
    setPumpCooldown(prev => ({ ...prev, [pumpId]: true }));
    if (cooldownTimerRef.current[pumpId]) {
      window.clearTimeout(cooldownTimerRef.current[pumpId]);
    }
    cooldownTimerRef.current[pumpId] = window.setTimeout(() => {
      setPumpCooldown(prev => ({ ...prev, [pumpId]: false }));
      delete cooldownTimerRef.current[pumpId];
    }, PUMP_CLICK_COOLDOWN_MS);
  }

  async function handleModeChange(mode) {
    if (busyAction) {
      return;
    }

    try {
      setBusyAction("mode");
      const nextState1 = await setWateringMode(mode);
      const nextState2 = { ...nextState1, deviceId: "pump-002" }; // Assuming same mode for both
      setDevices((prev) => ({ ...prev, "pump-001": nextState1, "pump-002": nextState2 }));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || String(error));
    } finally {
      setBusyAction("");
    }
  }

  async function handlePumpToggle(pumpId, setPumpFunc) {
    if (busyAction || pumpCooldown[pumpId]) {
      return;
    }

    try {
      setBusyAction(pumpId === "pump-001" ? "pump1" : "pump2");
      startPumpCooldown(pumpId);
      // Set mode to manual
      await setWateringMode("manual");
      // Toggle pump
      const device = devices[pumpId];
      const nextState = await setPumpFunc(!Boolean(device?.desiredEnabled));
      setDevices((prev) => ({ ...prev, [pumpId]: nextState }));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || String(error));
    } finally {
      setBusyAction("");
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="hero-kicker">Watering Modes</p>
          <h2 className="hero-title">Choose how irrigation should start</h2>
          <p className="hero-copy">
            Manual mode keeps the operator in charge. Automatic mode arms the system for future sensor-driven watering rules.
          </p>
        </div>
        <div className="hero-badges">
          <span className={isAutomatic ? "mode-pill live" : "mode-pill subtle"}>Automatic</span>
          <span className={!isAutomatic ? "mode-pill live" : "mode-pill subtle"}>Manual</span>
        </div>
      </section>

      {errorMessage ? <p className="status-banner error">{errorMessage}</p> : null}

      <section className="mode-grid">
        <article className={isAutomatic ? "mode-card active" : "mode-card"}>
          <p className="panel-kicker">Smart Mode</p>
          <h3>Automatic watering</h3>
          <p className="panel-copy">Automatically open both pumps based on Soil Moisture sensor readings.</p>
          <button className="primary-action" disabled={Boolean(busyAction) || isAutomatic} onClick={() => handleModeChange("automatic")} type="button">
            {modeBusy && !isAutomatic ? "Switching..." : "Start Automatically"}
          </button>
        </article>

        <article className={!isAutomatic ? "mode-card active" : "mode-card"}>
          <p className="panel-kicker">Manual Control</p>
          <h3>Pump 1</h3>
          <p className="panel-copy">Turn on Pump 1 and switch to Manual mode for direct control.</p>
          <button className="secondary-action" disabled={Boolean(busyAction) || pumpCooldown["pump-001"]} onClick={() => handlePumpToggle("pump-001", setPump1)} type="button">
            {pump1Busy ? "Toggling..." : pumpCooldown["pump-001"] ? "Cooldown..." : pump1Device?.desiredEnabled ? "Turn Off Pump 1" : "Turn On Pump 1"}
          </button>
        </article>

        <article className={!isAutomatic ? "mode-card active" : "mode-card"}>
          <p className="panel-kicker">Manual Control</p>
          <h3>Pump 2</h3>
          <p className="panel-copy">Turn on Pump 2 and switch to Manual mode for direct control.</p>
          <button className="secondary-action" disabled={Boolean(busyAction) || pumpCooldown["pump-002"]} onClick={() => handlePumpToggle("pump-002", setPump2)} type="button">
            {pump2Busy ? "Toggling..." : pumpCooldown["pump-002"] ? "Cooldown..." : pump2Device?.desiredEnabled ? "Turn Off Pump 2" : "Turn On Pump 2"}
          </button>
        </article>
      </section>
    </main>
  );
}
