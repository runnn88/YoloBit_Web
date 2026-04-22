import { useEffect } from "react";

export function usePolling(callback, intervalMs) {
  useEffect(() => {
    const timer = window.setInterval(callback, intervalMs);
    return () => window.clearInterval(timer);
  }, [callback, intervalMs]);
}
