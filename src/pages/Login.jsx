import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]= useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        const {error} = await supabase.auth.signInWithPassword({email,password})
        if (error) {
            setError(error.message)
        } else {
            navigate('/home')
        }
    }

    return(
        <div style={ui.shell}>
            <div style={ui.card}>
                <h1 style={ui.title}>Bienvenido a Velochat</h1>
                <p style={ui.subtitle}>Inicia sesión para continuar</p>

                {error && <div style={ui.error}>{error}</div>}

                <div style={ui.form}>
                    <input
                        type="email"
                        placeholder="Email"
                        onChange={e => setEmail(e.target.value)}
                        style={ui.input}
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        onChange={e => setPassword(e.target.value)}
                        style={ui.input}
                    />
                    <button onClick={handleLogin} style={ui.primaryButton}>Entrar</button>
                </div>

                <div style={ui.links}>
                    <Link to="/register" style={ui.link}>¿No tienes cuenta? Regístrate</Link>
                    <Link to="/ForgotPassword" style={ui.link}>¿Olvidaste tu contraseña?</Link>
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
        maxWidth: "420px",
        background: "#18181b",
        border: "1px solid #2e2e33",
        borderRadius: "16px",
        padding: "26px",
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    },
    title: { margin: 0, fontSize: "26px", fontWeight: 700 },
    subtitle: { margin: "8px 0 0", fontSize: "14px", color: "#71717a" },
    form: { marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" },
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
    links: { marginTop: "18px", display: "flex", flexDirection: "column", gap: "8px" },
    link: { color: "#60a5fa", fontSize: "14px", textDecoration: "none" },
}
export default Login