import React, { useEffect, useState } from "react";
import { Dashboard } from "../features/dashboard/Dashboard";
import { ConnectionPage } from "../features/connection/ConnectionPage";
import { YoloBitUsbProvider } from "../features/connection/YoloBitUsbContext";

function getPageFromHash(hash) {
  return hash === "#connection" ? "connection" : "dashboard";
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
    window.location.hash = nextPage === "connection" ? "connection" : "";
    setPage(nextPage);
  }

  return (
    <YoloBitUsbProvider>
      <nav className="top-nav">
        <div className="top-nav-inner">
          <button
            className={page === "dashboard" ? "top-nav-link active" : "top-nav-link"}
            onClick={() => navigate("dashboard")}
            type="button"
          >
            Home
          </button>
          <button
            className={page === "connection" ? "top-nav-link active" : "top-nav-link"}
            onClick={() => navigate("connection")}
            type="button"
          >
            Check YoloBit Connection
          </button>
        </div>
      </nav>

      {page === "connection" ? <ConnectionPage /> : <Dashboard />}
    </YoloBitUsbProvider>
  );
}
