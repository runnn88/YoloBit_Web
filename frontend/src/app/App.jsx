import React, { useEffect, useState } from "react";
import { Dashboard } from "../features/dashboard/Dashboard";
import { WateringPage } from "../features/watering/WateringPage";
import { ConnectionPage } from "../features/connection/ConnectionPage";

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
