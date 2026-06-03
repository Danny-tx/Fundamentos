import useNetworkStatus from "../hooks/useNetworkStatus";

// Muestra un banner en la parte superior cuando no hay conexión a internet.
// Desaparece automáticamente cuando se recupera la conexión.
function OfflineIndicator() {
    const isOnline = useNetworkStatus()

    if (isOnline) return null

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#1a1a1a',
            borderBottom: '1px solid #444',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#aaa',
            fontSize: '14px',
            fontWeight: 500,
        }}>
            {/* Círculo animado pulsando */}
            <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#f5a623',
                display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            Esperando conexión...

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }
            `}</style>
        </div>
    )
}

export default OfflineIndicator