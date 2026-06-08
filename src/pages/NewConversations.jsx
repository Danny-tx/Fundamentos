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
        maxWidth: "760px",
        margin: "24px auto",
        padding: "22px",
        borderRadius: "16px",
        background: "#18181b",
        border: "1px solid #2e2e33",
        boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
    },
    section: {
        background: "#111113",
        border: "1px solid #2e2e33",
        borderRadius: "14px",
        padding: "16px",
        marginTop: "14px",
    },
    ghostBtn: {
        padding: "9px 14px",
        borderRadius: "10px",
        border: "1px solid #2e2e33",
        background: "#1c1c1f",
        color: "#a1a1aa",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 500,
        fontFamily: "inherit",
    },
    primaryBtn: {
        padding: "10px 16px",
        borderRadius: "10px",
        border: "none",
        background: "#3b82f6",
        color: "white",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 600,
        fontFamily: "inherit",
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid #2e2e33",
        background: "#18181b",
        color: "#f4f4f5",
        fontSize: "14px",
        fontFamily: "inherit",
        outline: "none",
    },
}

function NewConversation() {
    const [contacts, setContacts] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    const [groupName, setGroupName] = useState('')
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        getAcceptedContacts()
    }, [])

    const getAcceptedContacts = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        const { data } = await supabase
            .from('contacts')
            .select('addressee_id')
            .eq('requester_id', user.id)
            .eq('status', 'accepted')

        if (data) {
            const contactsWithProfiles = await Promise.all(
                data.map(async (item) => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, username, full_name')
                        .eq('id', item.addressee_id)
                        .single()
                    return profile
                })
            )
            setContacts(contactsWithProfiles.filter(Boolean))
        }
        setLoading(false)
    }

    const toggleUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const createConversation = async () => {
    if (selectedUsers.length === 0) {
        setMessage('Selecciona al menos un contacto')
        return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const isGroup = selectedUsers.length > 1
    const type = isGroup ? 'group' : 'direct'
    const name = isGroup ? groupName || 'Grupo sin nombre' : null

    const { data: conversationId, error } = await supabase
        .rpc('create_conversation', {
            p_type: type,
            p_name: name,
            p_participant_ids: selectedUsers
        })

    if (error) {
        console.error("Error:", error)
        setMessage(`Error: ${error.message}`)
        return
    }

    navigate('/conversations')
}

    if (loading) {
        return (
            <div style={{ ...ui.shell, display: "flex", alignItems: "center", justifyContent: "center", color: "#71717a" }}>
                Cargando contactos...
            </div>
        )
    }

    return (
        <div style={ui.shell}>
            <div style={ui.header}>
                <button onClick={() => navigate("/conversations")} style={ui.ghostBtn}>← Volver</button>
                <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Nueva conversación</h1>
            </div>

            <main style={ui.card}>
                <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#71717a" }}>
                    Selecciona uno o más contactos para iniciar una conversación.
                </p>

                {message && (
                    <div style={{
                        marginBottom: "12px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "#2d0a0a",
                        border: "1px solid #7f1d1d",
                        color: "#f87171",
                        fontSize: "14px",
                    }}>
                        {message}
                    </div>
                )}

                <section style={ui.section}>
                    <h2 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 600 }}>Contactos</h2>
                    {contacts.length === 0 ? (
                        <p style={{ margin: 0, color: "#71717a", fontSize: "14px" }}>
                            No tienes contactos disponibles todavía.
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {contacts.map((contact) => {
                                const selected = selectedUsers.includes(contact.id)
                                return (
                                    <label
                                        key={contact.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: `1px solid ${selected ? "#3b82f6" : "#2e2e33"}`,
                                            background: selected ? "rgba(59,130,246,0.12)" : "#18181b",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => toggleUser(contact.id)}
                                        />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontSize: "14px", fontWeight: 600, color: "#f4f4f5" }}>
                                                {contact.username}
                                            </span>
                                            <span style={{ fontSize: "12px", color: "#71717a" }}>
                                                {contact.full_name || "Sin nombre"}
                                            </span>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    )}
                </section>

                {selectedUsers.length > 1 && (
                    <section style={ui.section}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#a1a1aa", fontSize: "13px" }}>
                            Nombre del grupo
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Equipo de estudio"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            style={ui.input}
                        />
                    </section>
                )}

                <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button onClick={createConversation} style={ui.primaryBtn}>Crear conversación</button>
                    <button onClick={() => navigate("/conversations")} style={ui.ghostBtn}>Cancelar</button>
                </div>
            </main>
        </div>
    )
}

export default NewConversation