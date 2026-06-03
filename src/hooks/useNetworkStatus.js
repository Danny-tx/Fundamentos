import { useState, useEffect } from "react";

// Hook que escucha los eventos del navegador "online" y "offline"
// y devuelve true si hay conexión, false si no la hay
function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const goOnline = () => setIsOnline(true)
        const goOffline = () => setIsOnline(false)

        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)

        return () => {
            window.removeEventListener('online', goOnline)
            window.removeEventListener('offline', goOffline)
        }
    }, [])

    return isOnline
}

export default useNetworkStatus