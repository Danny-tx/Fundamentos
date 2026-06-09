import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import useMutedConversations from "../hooks/useMutedConversations"

function Conversations() {
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [menuOpen, setMenuOpen] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const navigate = useNavigate()
    const channelRef = useRef(null)
    const { isMuted } = useMutedConversations()
    const t = tokens

    useEffect(() => {
        let channel
        const run = async () => {
            await getConversations()
            setLoading(false)
            channel = supabase.channel('conversations-list', { config: { broadcast: { self: true } } })
                .on('broadcast', { event: 'new_message' }, async () => { await getConversations() })
                .subscribe()
            channelRef.current = channel
        }
        run()
        return () => { if (channel) supabase.removeChannel(channel) }
    }, [])

    // Cerrar menú al click fuera
    useEffect(() => {
        const close = () => setMenuOpen(null)
        if (menuOpen) document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [menuOpen])

    const getConversations = async () => {
        const { data } = await supabase.rpc('get_conversations')
        if (data) setConversations(data)
    }

    const doDelete = async () => {
        await supabase.rpc('delete_conversation', { p_conversation_id: deleteConfirm })
        setDeleteConfirm(null)
        await getConversations()
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: t.bg, color: t.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{googleFont}</style>
            Cargando...
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{googleFont + scrollbarCss}</style>

            {/* Modal eliminar conversación */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '28px 24px', width: '320px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: t.text }}>¿Eliminar conversación?</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '14px', color: t.muted, lineHeight: 1.5 }}>Se borrará todo el historial de mensajes.</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.muted, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Cancelar</button>
                            <button onClick={doDelete} style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600 }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ background: t.header, borderBottom: `1px solid ${t.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => navigate('/home')} style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.muted, borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 500 }}>← Inicio</button>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: t.text, flex: 1 }}>Conversaciones</h1>
                <button onClick={() => navigate('/new-conversations')} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600 }}>+ Nueva</button>
            </div>

            {/* Lista */}
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 20px' }}>
                {conversations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: t.muted }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                        <p style={{ margin: 0, fontSize: '15px' }}>No tienes conversaciones aún</p>
                        <button onClick={() => navigate('/new-conversations')} style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600 }}>Iniciar una</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {conversations.map(item => (
                            <div key={item.conversation_id}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: t.card, borderRadius: '14px', border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'background .15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = t.surface}
                                onMouseLeave={e => e.currentTarget.style.background = t.card}
                            >
                                {/* Avatar */}
                                <div onClick={() => navigate(`/chat/${item.conversation_id}`)}
                                    style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '18px', flexShrink: 0 }}>
                                    {(item.name || '?')[0].toUpperCase()}
                                </div>

                                {/* Info */}
                                <div onClick={() => navigate(`/chat/${item.conversation_id}`)} style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.name || 'Sin nombre'}
                                        </p>
                                        {isMuted(item.conversation_id) && <span style={{ fontSize: '13px', color: t.muted }}>🔕</span>}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: t.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.last_message?.startsWith('[foto]') ? '📷 Foto' : (item.last_message || 'Sin mensajes')}
                                    </p>
                                </div>

                                {/* Menú ⋮ */}
                                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => setMenuOpen(menuOpen === item.conversation_id ? null : item.conversation_id)}
                                        style={{ background: 'none', border: 'none', color: t.muted, fontSize: '20px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = t.surface}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >⋮</button>
                                    {menuOpen === item.conversation_id && (
                                        <div style={{ position: 'absolute', right: 0, top: '36px', background: t.card, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '6px', zIndex: 10, minWidth: '170px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                                            <button onClick={() => { setDeleteConfirm(item.conversation_id); setMenuOpen(null) }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 12px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}>
                                                🗑️ Eliminar conversación
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

const tokens = { bg: '#0f0f10', header: '#111113', card: '#18181b', surface: '#1c1c1f', border: '#2e2e33', text: '#f4f4f5', muted: '#71717a' }
const googleFont = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`
const scrollbarCss = `::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2e2e33;border-radius:4px}`

export default Conversations