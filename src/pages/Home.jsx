import { useState, useEffect, useRef } from "react"
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
    const [showNotifs, setShowNotifs] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [currentUser, setCurrentUser] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const bellRef = useRef(null)

    useEffect(() => {
        fetchNotifications()
        loadUser()
        const close = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false)
        }
        document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [])

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUser(user)
        const { data: profile } = await supabase.from('profiles').select('avatar_url, username').eq('id', user.id).single()
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
    }

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        const { data: notifData } = await supabase
            .from('notifications')
            .select('id, title, body, conversation_id, created_at, read, sender_id')
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(100)

        if (notifData) {
            const seen = new Map()
            for (const n of notifData) {
                if (!seen.has(n.conversation_id)) {
                    seen.set(n.conversation_id, {
                        id: n.id,
                        conversation_id: n.conversation_id,
                        name: n.title || 'Nuevo mensaje',
                        preview: n.body || '',
                        sender_id: n.sender_id || null,
                    })
                }
            }

            // Cargar avatares de los remitentes
            const grouped = await Promise.all(Array.from(seen.values()).map(async n => {
                let displayName = n.name
                let avatar_url = null
                if (user) {
                    try {
                        const saved = localStorage.getItem(`chat_custom_${user.id}_${n.conversation_id}`)
                        if (saved) {
                            const { nickname } = JSON.parse(saved)
                            if (nickname) displayName = nickname
                        }
                    } catch (_) {}
                }
                // Buscar avatar del remitente
                if (n.sender_id) {
                    const { data: senderProfile } = await supabase
                        .from('profiles').select('avatar_url').eq('id', n.sender_id).single()
                    avatar_url = senderProfile?.avatar_url || null
                }
                return {
                    ...n,
                    name: displayName,
                    preview: n.preview?.startsWith('[foto]') ? '📷 Foto' : n.preview,
                    avatar_url,
                }
            }))

            setNotifications(grouped)
            setUnreadCount(grouped.length)
        }
    }

    const markAllRead = async () => {
        await supabase.from('notifications').update({ read: true }).eq('read', false)
        setNotifications([])
        setUnreadCount(0)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate("/")
    }

    return (
        <div style={ui.shell}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
            <div style={ui.header}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Velochat</h1>
                    <p style={ui.subtitle}>Centro de navegación</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* 🔔 Campana de notificaciones */}
                    <div ref={bellRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => { setShowNotifs(p => !p); fetchNotifications() }}
                            style={{
                                position: 'relative', background: showNotifs ? '#27272a' : '#1c1c1f',
                                border: '1px solid #2e2e33', borderRadius: '10px',
                                width: '40px', height: '40px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px', transition: 'background .15s'
                            }}
                            title="Notificaciones"
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-6px', right: '-6px',
                                    background: '#ef4444', color: 'white', borderRadius: '10px',
                                    fontSize: '11px', fontWeight: 700, minWidth: '18px', height: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 4px', border: '2px solid #111113'
                                }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                            )}
                        </button>

                        {showNotifs && (
                            <div style={{
                                position: 'absolute', right: 0, top: '48px', width: '300px',
                                background: '#18181b', border: '1px solid #2e2e33', borderRadius: '14px',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden'
                            }}>
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid #2e2e33', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5' }}>Notificaciones</span>
                                    {notifications.length > 0 && (
                                        <button onClick={markAllRead} style={{
                                            fontSize: '12px', color: '#3b82f6', cursor: 'pointer',
                                            background: 'none', border: 'none', fontFamily: 'inherit',
                                            padding: 0
                                        }}>✓ Leer todo</button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '28px 16px', textAlign: 'center', color: '#52525b', fontSize: '13px' }}>
                                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
                                        Todo al día, sin mensajes sin leer
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                        {notifications.map(n => (
                                            <div key={n.id}
                                                onClick={async () => {
                                                    // Marcar como leída
                                                    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
                                                    navigate(`/chat/${n.conversation_id}`)
                                                    setShowNotifs(false)
                                                    fetchNotifications()
                                                }}
                                                style={{
                                                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #1c1c1f',
                                                    display: 'flex', gap: '12px', alignItems: 'center', transition: 'background .12s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#1c1c1f'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{
                                                    width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 700, color: 'white', fontSize: '15px', overflow: 'hidden'
                                                }}>
                                                    {n.avatar_url
                                                        ? <img src={n.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none' }} />
                                                        : (n.name || '?')[0].toUpperCase()
                                                    }
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5', marginBottom: '2px' }}>{n.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.preview}</div>
                                                </div>
                                                {n.unread > 0 && (
                                                    <span style={{
                                                        background: '#3b82f6', color: 'white', borderRadius: '10px',
                                                        fontSize: '11px', fontWeight: 700, minWidth: '20px', height: '20px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0
                                                    }}>{n.unread}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button onClick={handleLogout} style={ui.ghostButton}>Cerrar sesión</button>
                    {/* Avatar del usuario actual */}
                    <div onClick={() => navigate('/profile')}
                        title="Mi perfil"
                        style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, color: 'white', fontSize: '15px',
                            cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
                            border: '2px solid #2e2e33', transition: 'border-color .15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#2e2e33'}
                    >
                        {avatarUrl
                            ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarUrl(null)} />
                            : (currentUser?.user_metadata?.username || currentUser?.email || '?')[0].toUpperCase()
                        }
                    </div>
                </div>
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

                    <div style={ui.tile}>
                        <p style={ui.tileTitle}>Panel Admin</p>
                        <p style={ui.tileText}>Estadísticas y control del sistema (solo admins).</p>
                        <button onClick={() => navigate("/admin")} style={{ ...ui.primaryButton, background: '#6d28d9' }}>Abrir panel</button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Home