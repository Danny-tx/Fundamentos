import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleReset = async () => {
        const {error} = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:5173/reset-password'
        })
        if (error) {
            setError(error.message)
        } else {
            setMessage('Revisa tu correo para restablecer tu constraseña')
        }
    }

    return (
        <div style={ui.shell}>
            <div style={ui.card}>
                <h1 style={ui.title}>Recuperar contraseña</h1>
                <p style={ui.subtitle}>Te enviaremos un enlace para restablecer tu acceso.</p>

                {error && <div style={ui.error}>{error}</div>}
                {message && <div style={ui.success}>{message}</div>}

                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <input
                        type="email"
                        placeholder="Email"
                        onChange={e => setEmail(e.target.value)}
                        style={ui.input}
                    />
                    <button onClick={handleReset} style={ui.primaryButton}>Enviar correo</button>
                </div>

                <p style={{ marginTop: "16px" }}>
                    <Link to={"/"} style={ui.link}>Volver al login</Link>
                </p>
            </div>
        </div>
    )
}
const ui = {
    shell: {
        minHeight: "100vh",
        background: "#0f0f10",
        color: "#f4f4f5",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    },
    card: {
        width: "100%",
        maxWidth: "440px",
        background: "#18181b",
        border: "1px solid #2e2e33",
        borderRadius: "16px",
        padding: "26px",
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    },
    title: { margin: 0, fontSize: "24px", fontWeight: 700 },
    subtitle: { margin: "8px 0 0", fontSize: "14px", color: "#71717a" },
    input: {
        width: "100%",
        padding: "11px 14px",
        borderRadius: "10px",
        border: "1px solid #2e2e33",
        background: "#111113",
        color: "#f4f4f5",
        outline: "none",
        fontSize: "14px",
        fontFamily: "inherit",
        boxSizing: "border-box",
    },
    primaryButton: {
        border: "none",
        borderRadius: "10px",
        background: "#3b82f6",
        color: "white",
        padding: "11px 14px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 600,
        fontFamily: "inherit",
    },
    error: {
        marginTop: "14px",
        background: "#2d0a0a",
        border: "1px solid #7f1d1d",
        color: "#f87171",
        borderRadius: "10px",
        padding: "10px 12px",
        fontSize: "14px",
    },
    success: {
        marginTop: "14px",
        background: "#10251a",
        border: "1px solid #14532d",
        color: "#4ade80",
        borderRadius: "10px",
        padding: "10px 12px",
        fontSize: "14px",
    },
    link: { color: "#60a5fa", fontSize: "14px", textDecoration: "none" },
}

export default ForgotPassword