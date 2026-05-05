import React, { useEffect, useRef, useState } from "react";
import { fetchDevices, setPump, setWateringMode } from "../devices/deviceAPI";
import { PumpControl } from "../devices/PumpControl";

const PUMP_CLICK_COOLDOWN_MS = 3000;

export function WateringPage() {
  const [devices, setDevices] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [pumpCooldown, setPumpCooldown] = useState(false);
  const cooldownTimerRef = useRef(null);

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
      if (cooldownTimerRef.current) {
        window.clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const pumpDevice = devices["pump-001"] || {};
  const isAutomatic = pumpDevice.wateringMode === "automatic";
  const pumpBusy = busyAction === "pump";
  const modeBusy = busyAction === "mode";
  const pumpLocked = pumpBusy || pumpCooldown;

  function startPumpCooldown() {
    setPumpCooldown(true);
    if (cooldownTimerRef.current) {
      window.clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = window.setTimeout(() => {
      setPumpCooldown(false);
      cooldownTimerRef.current = null;
    }, PUMP_CLICK_COOLDOWN_MS);
  }

  async function handleModeChange(mode) {
    if (busyAction) {
      return;
    }

    try {
      setBusyAction("mode");
      const nextState = await setWateringMode(mode);
      setDevices((prev) => ({ ...prev, "pump-001": nextState }));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || String(error));
    } finally {
      setBusyAction("");
    }
  }

  async function handlePumpToggle() {
    if (busyAction || pumpCooldown) {
      return;
    }

    try {
      setBusyAction("pump");
      startPumpCooldown();
      const nextState = await setPump(!Boolean(pumpDevice.desiredEnabled));
      setDevices((prev) => ({ ...prev, "pump-001": nextState }));
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
          <p className="panel-copy">Use backend state to prepare for soil-based watering logic without manually toggling the pump every time.</p>
          <button className="primary-action" disabled={Boolean(busyAction) || isAutomatic} onClick={() => handleModeChange("automatic")} type="button">
            {modeBusy && !isAutomatic ? "Switching..." : "Start Automatically"}
          </button>
        </article>

        <article className={!isAutomatic ? "mode-card active" : "mode-card"}>
          <p className="panel-kicker">Operator Mode</p>
          <h3>Manual watering</h3>
          <p className="panel-copy">Keep the pump under direct human control from the web dashboard.</p>
          <button className="secondary-action" disabled={Boolean(busyAction) || !isAutomatic} onClick={() => handleModeChange("manual")} type="button">
            {modeBusy && isAutomatic ? "Switching..." : "Switch to Manual"}
          </button>
        </article>
      </section>

      <PumpControl
        device={pumpDevice}
        disabled={isAutomatic || pumpLocked}
        hint={
          isAutomatic
            ? "Manual pump switching is disabled while automatic mode is armed."
            : pumpBusy
              ? "Sending pump command to the backend..."
              : pumpCooldown
                ? "Pump button is briefly locked to prevent spam clicks."
                : "Use manual override to start or stop watering now."
        }
        onToggle={handlePumpToggle}
        title="Main Pump"
      />
    </main>
  );
}
