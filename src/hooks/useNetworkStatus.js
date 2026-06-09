import { useState, useEffect, useRef } from "react";

const INTERVAL_MS = 5000;

function checkRealConnectivity() {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      img.src = "";
      resolve(false);
    }, 3000);
    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    img.src = `https://www.google.com/favicon.ico?_=${Date.now()}`;
  });
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

    const handleOffline = () => setIsOnline(false);
    const handleOnline = () => runCheck();

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return isOnline;
}

export default useNetworkStatus;