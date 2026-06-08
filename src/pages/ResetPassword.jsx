import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [ready, setReady] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event,session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setReady(true)
                setMessage('Puedes escribir tu contraseña')
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    const handleReset = async () => {
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setError(error.message)
        } else {
            setMessage('Constraseña actualizada')
            setTimeout(() => navigate('/'), 2000)
        }
        setLoading(false)
    }

    if (ready) {
        return (
            <div style={{ ...ui.shell, display: "flex", alignItems: "center", justifyContent: "center", color: "#71717a" }}>
                Verificando enlace...
            </div>
        )
    }

    return (
        <div style={ui.shell}>
            <div style={ui.card}>
                <h1 style={ui.title}>Nueva contraseña</h1>
                <p style={ui.subtitle}>Configura una contraseña segura para tu cuenta.</p>

                {message && <div style={ui.success}>{message}</div>}
                {error && <div style={ui.error}>{error}</div>}

                <div style={ui.form}>
                    <input
                        type="password"
                        placeholder="Nueva contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={ui.input}
                    />
                    <input
                        type="password"
                        placeholder="Confirmar nueva contraseña"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={ui.input}
                    />
                    <button onClick={handleReset} disabled={loading} style={ui.primaryButton}>
                        {loading ? 'Guardando...' : 'Guardar contraseña'}
                    </button>
                </div>
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
    form: { marginTop: "18px", display: "flex", flexDirection: "column", gap: "12px" },
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
        opacity: 1,
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
}

export default ResetPassword