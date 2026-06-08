import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

const ui = {
    shell: {
        minHeight: "100vh",
        background: "#0f0f10",
        color: "#f4f4f5",
        fontFamily: "'DM Sans', sans-serif",
    },
    header: {
        background: "#111113",
        borderBottom: "1px solid #1c1c1f",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
    },
    card: {
        maxWidth: "720px",
        margin: "28px auto",
        padding: "26px",
        borderRadius: "16px",
        border: "1px solid #2e2e33",
        background: "#18181b",
        boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
    },
    subtitle: { margin: "8px 0 0", color: "#71717a", fontSize: "14px" },
    primaryButton: {
        border: "none",
        background: "#3b82f6",
        color: "white",
        borderRadius: "10px",
        padding: "10px 16px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 600,
        fontFamily: "inherit",
    },
    ghostButton: {
        border: "1px solid #2e2e33",
        background: "#1c1c1f",
        color: "#a1a1aa",
        borderRadius: "10px",
        padding: "10px 16px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 500,
        fontFamily: "inherit",
    },
    tileGrid: {
        marginTop: "20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
    },
    tile: {
        borderRadius: "14px",
        border: "1px solid #2e2e33",
        background: "#111113",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "flex-start",
    },
    tileTitle: { margin: 0, fontSize: "14px", fontWeight: 600, color: "#f4f4f5" },
    tileText: { margin: 0, fontSize: "13px", color: "#71717a", lineHeight: 1.45 },
}

function Home() {
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate("/")
    }

    return (
        <div style={ui.shell}>
            <div style={ui.header}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Velochat</h1>
                    <p style={ui.subtitle}>Centro de navegación</p>
                </div>
                <button onClick={handleLogout} style={ui.ghostButton}>Cerrar sesión</button>
            </div>

            <main style={ui.card}>
                <h2 style={{ margin: 0, textAlign: "center", fontSize: "18px" }}>Bienvenido a Velochat</h2>

                <div style={ui.tileGrid}>
                    <div style={ui.tile}>
                        <p style={ui.tileTitle}>Mi perfil</p>
                        <p style={ui.tileText}>Edita tu información y seguridad de la cuenta.</p>
                        <button onClick={() => navigate("/profile")} style={ui.primaryButton}>Abrir perfil</button>
                    </div>

                    <div style={ui.tile}>
                        <p style={ui.tileTitle}>Conversaciones</p>
                        <p style={ui.tileText}>Revisa tus chats directos y grupales.</p>
                        <button onClick={() => navigate("/conversations")} style={ui.primaryButton}>Ver conversaciones</button>
                    </div>

                    <div style={ui.tile}>
                        <p style={ui.tileTitle}>Contactos</p>
                        <p style={ui.tileText}>Gestiona solicitudes y contactos aceptados.</p>
                        <button onClick={() => navigate("/contacts")} style={ui.primaryButton}>Ir a contactos</button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Home
