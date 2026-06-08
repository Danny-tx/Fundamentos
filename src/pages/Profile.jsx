import { useState, useEffect } from "react"
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
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    card: {
        maxWidth: "680px",
        margin: "24px auto",
        padding: "22px",
        borderRadius: "16px",
        background: "#18181b",
        border: "1px solid #2e2e33",
        boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
    },
    label: { display: "block", marginBottom: "6px", fontSize: "13px", color: "#a1a1aa" },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid #2e2e33",
        background: "#111113",
        color: "#f4f4f5",
        fontSize: "14px",
        fontFamily: "inherit",
        outline: "none",
    },
    row: { display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" },
    message: {
        success: {
            background: "#10251a",
            border: "1px solid #14532d",
            color: "#4ade80",
            padding: "10px 12px",
            borderRadius: "10px",
            fontSize: "14px",
            marginTop: "14px",
        },
        error: {
            background: "#2d0a0a",
            border: "1px solid #7f1d1d",
            color: "#f87171",
            padding: "10px 12px",
            borderRadius: "10px",
            fontSize: "14px",
            marginTop: "14px",
        },
    },
    primaryBtn: {
        padding: "10px 16px",
        border: "none",
        borderRadius: "10px",
        background: "#3b82f6",
        color: "white",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 600,
        fontFamily: "inherit",
    },
    ghostBtn: {
        padding: "10px 16px",
        border: "1px solid #2e2e33",
        borderRadius: "10px",
        background: "#1c1c1f",
        color: "#a1a1aa",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 500,
        fontFamily: "inherit",
    },
}

function Profile() {
    const [loading, setLoading] = useState(true)
    const [username, setUsername] = useState("")
    const [fullName, setFullName] = useState("")
    const [bio, setBio] = useState("")
    const [message, setMessage] = useState({ text: "", type: "" })
    const [editing, setEditing] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        getProfile()
    }, [])

    const getProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

        if (data) {
            setUsername(data.username || "")
            setFullName(data.full_name || "")
            setBio(data.bio || "")
        }
        setLoading(false)
    }

    const updateProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase
            .from("profiles")
            .update({
                username,
                full_name: fullName,
                bio,
            })
            .eq("id", user.id)

        if (error) {
            setMessage({ text: "Error al actualizar perfil", type: "error" })
            return
        }

        setMessage({ text: "Perfil actualizado correctamente", type: "success" })
        setEditing(false)
    }

    if (loading) {
        return (
            <div style={{ ...ui.shell, display: "flex", alignItems: "center", justifyContent: "center", color: "#71717a" }}>
                Cargando perfil...
            </div>
        )
    }

    return (
        <div style={ui.shell}>
            <div style={ui.header}>
                <button onClick={() => navigate("/home")} style={ui.ghostBtn}>← Inicio</button>
                <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Mi perfil</h1>
            </div>

            <main style={ui.card}>
                <p style={{ margin: 0, color: "#71717a", fontSize: "14px" }}>
                    Edita tu información personal y mantén tu cuenta actualizada.
                </p>

                {message.text && (
                    <div style={message.type === "success" ? ui.message.success : ui.message.error}>
                        {message.text}
                    </div>
                )}

                <div style={ui.row}>
                    <div>
                        <label style={ui.label}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={!editing}
                            style={{ ...ui.input, opacity: editing ? 1 : 0.7 }}
                        />
                    </div>

                    <div>
                        <label style={ui.label}>Nombre completo</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={!editing}
                            style={{ ...ui.input, opacity: editing ? 1 : 0.7 }}
                        />
                    </div>

                    <div>
                        <label style={ui.label}>Biografía</label>
                        <textarea
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            disabled={!editing}
                            style={{ ...ui.input, resize: "vertical", opacity: editing ? 1 : 0.7 }}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
                    {editing ? (
                        <>
                            <button onClick={updateProfile} style={ui.primaryBtn}>Guardar cambios</button>
                            <button
                                onClick={() => {
                                    setEditing(false)
                                    setMessage({ text: "", type: "" })
                                }}
                                style={ui.ghostBtn}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)} style={ui.primaryBtn}>Editar perfil</button>
                    )}
                    <button onClick={() => navigate("/change-password")} style={ui.ghostBtn}>Cambiar contraseña</button>
                </div>
            </main>
        </div>
    )
}

export default Profile
