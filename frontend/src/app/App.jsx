import React, { useEffect, useState } from "react";
import { Dashboard } from "../features/dashboard/Dashboard";
import { WateringPage } from "../features/watering/WateringPage";
import { ConnectionPage } from "../features/connection/ConnectionPage";
import { fetchDevices } from "../features/devices/deviceAPI";

function getPageFromHash(hash) {
  if (hash === "#watering") {
    return "watering";
  }
  if (hash === "#connection") {
    return "connection";
  }
  return "dashboard";
}

export default function App() {
  const [page, setPage] = useState(getPageFromHash(window.location.hash));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkConnection() {
      try {
        const devices = await fetchDevices();
        if (!cancelled) {
          setIsConnected(Boolean(devices?.["yolobit-001"]?.connected));
        }
      } catch (error) {
        if (!cancelled) {
          setIsConnected(false);
        }
      }
    }

    checkConnection();
    const timer = window.setInterval(checkConnection, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash(window.location.hash));
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigate(nextPage) {
    if (nextPage === "watering") {
      window.location.hash = "watering";
    } else if (nextPage === "connection") {
      window.location.hash = "connection";
    } else {
      window.location.hash = "";
    }
    setPage(nextPage);
  }

  return (
    <>
      <nav className="top-nav">
        <div className="top-nav-inner">
          <div className="brand-block">
            <p className="brand-kicker">YoloFarm</p>
            <h1 className="brand-title">Yolo:Bit Smart Watering</h1>
          </div>
          <div className="top-nav-links">
            <button
              className={page === "dashboard" ? "top-nav-link active" : "top-nav-link"}
              onClick={() => navigate("dashboard")}
              type="button"
            >
              Dashboard
            </button>
            <button
              className={page === "watering" ? "top-nav-link active" : "top-nav-link"}
              onClick={() => navigate("watering")}
              type="button"
              disabled={!isConnected}
              style={{ opacity: !isConnected ? 0.5 : 1, cursor: !isConnected ? 'not-allowed' : 'pointer' }}
            >
              Watering Options
            </button>
            <button
              className={page === "connection" ? "top-nav-link active" : "top-nav-link"}
              onClick={() => navigate("connection")}
              type="button"
            >
              Connection Check
            </button>
          </div>
        </div>
      </nav>

      {page === "watering" ? <WateringPage /> : null}
      {page === "connection" ? <ConnectionPage /> : null}
      {page === "dashboard" ? <Dashboard /> : null}
    </>
  );
}
