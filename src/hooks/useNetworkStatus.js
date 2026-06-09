import { useState, useEffect, useRef } from "react";

const CHECK_URL = "https://www.gstatic.com/generate_204";
const INTERVAL_MS = 4000;

async function checkRealConnectivity() {
  try {
    const res = await fetch(CHECK_URL, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef(null);

  const runCheck = async () => {
    const online = await checkRealConnectivity();
    setIsOnline(online);
  };

  useEffect(() => {
    runCheck();

    intervalRef.current = setInterval(runCheck, INTERVAL_MS);

    const handleOnline = () => runCheck();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export default useNetworkStatus;
