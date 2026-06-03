import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { useParams, useNavigate } from "react-router-dom"
import useBlockedUsers from "../hooks/useBlockedUsers"
import useMutedConversations from "../hooks/useMutedConversations"

/* ─── Modal de confirmación genérico ─── */
function ConfirmModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, children }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn .15s ease'
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity:0; transform:scale(.96) } to { opacity:1; transform:scale(1) } }
                @keyframes slideUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
            `}</style>
            <div style={{
                background: '#18181b', border: '1px solid #2e2e33',
                borderRadius: '16px', padding: '28px 24px', width: '340px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                animation: 'slideUp .18s ease', fontFamily: "'DM Sans', sans-serif"
            }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 600, color: '#f4f4f5' }}>{title}</h3>
                <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#71717a', lineHeight: 1.5 }}>{message}</p>
                {children}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{
                        padding: '9px 18px', borderRadius: '10px', border: '1px solid #2e2e33',
                        background: 'transparent', color: '#a1a1aa', cursor: 'pointer',
                        fontSize: '14px', fontFamily: 'inherit', fontWeight: 500,
                        transition: 'background .15s'
                    }}
                        onMouseEnter={e => e.target.style.background = '#27272a'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                    >Cancelar</button>
                    <button onClick={onConfirm} style={{
                        padding: '9px 18px', borderRadius: '10px', border: 'none',
                        background: confirmColor || '#ef4444', color: 'white', cursor: 'pointer',
                        fontSize: '14px', fontFamily: 'inherit', fontWeight: 600,
                        transition: 'opacity .15s'
                    }}
                        onMouseEnter={e => e.target.style.opacity = '0.85'}
                        onMouseLeave={e => e.target.style.opacity = '1'}
                    >{confirmLabel}</button>
                </div>
            </div>
        </div>
    )
}

/* ─── Componente principal Chat ─── */
function Chat() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [conversation, setConversation] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [otherUserId, setOtherUserId] = useState(null)
    const [showMenu, setShowMenu] = useState(false)

    // Editar
    const [editingId, setEditingId] = useState(null)
    const [editContent, setEditContent] = useState('')

    // Modales de confirmación
    const [deleteConfirm, setDeleteConfirm] = useState(null)   // messageId a eliminar
    const [editConfirm, setEditConfirm] = useState(null)        // { id, newContent }

    // Notificaciones
    const [notifPermission, setNotifPermission] = useState(Notification.permission)

    const channelRef = useRef(null)
    const messagesEndRef = useRef(null)

    const { blockUser, unblockUser, isBlocked } = useBlockedUsers()
    const { toggleMute, isMuted } = useMutedConversations()

    useEffect(() => {
        let channel
        const run = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
            await getConversation(user)
            await getMessages()
            setLoading(false)

            channel = supabase
                .channel(`chat-${id}`, { config: { broadcast: { self: true } } })
                .on('broadcast', { event: 'new_message' }, async (payload) => {
                    await getMessages()
                    if (payload?.payload?.sender_id && payload.payload.sender_id !== user.id) {
                        triggerNotification(payload.payload.sender_name, payload.payload.preview)
                    }
                })
                .subscribe()

            channelRef.current = channel
            await supabase.rpc('mark_messages_read', { p_conversation_id: id })
        }
        run()
        return () => { if (channel) supabase.removeChannel(channel) }
    }, [id])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(p => setNotifPermission(p))
        }
    }, [])

    // Cerrar menú al hacer click fuera
    useEffect(() => {
        const close = () => setShowMenu(false)
        if (showMenu) document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [showMenu])

    const triggerNotification = (senderName, preview) => {
        if (Notification.permission !== 'granted') return
        if (document.visibilityState === 'visible') return
        new Notification(`Nuevo mensaje de ${senderName || 'alguien'}`, {
            body: preview || 'Tienes un nuevo mensaje',
            icon: '/vite.svg'
        })
    }

    const getConversation = async (user) => {
        const { data } = await supabase.from('conversations').select('id, name, type').eq('id', id).single()
        if (data) {
            const { data: conversationName } = await supabase.rpc('get_conversation_name', { p_conversation_id: id })
            data.name = conversationName
            setConversation(data)
            if (data.type === 'direct' && user) {
                const { data: otherId } = await supabase.rpc('get_other_participant', { p_conversation_id: id })
                if (otherId) setOtherUserId(otherId)
            }
        }
    }

    const getMessages = async () => {
        const { data } = await supabase.rpc('get_messages', { p_conversation_id: id })
        if (data) {
            setMessages(data.map(msg => ({
                id: msg.id, content: msg.content, created_at: msg.created_at,
                sender_id: msg.sender_id, profiles: { username: msg.username },
                is_deleted: msg.is_deleted, is_edited: msg.is_edited,
                edited_at: msg.edited_at, read_count: msg.read_count
            })))
            await supabase.rpc('mark_messages_read', { p_conversation_id: id })
        }
    }

    const sendMessage = async () => {
        if (!newMessage.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.rpc('send_message', { p_conversation_id: id, p_content: newMessage.trim() })
        if (error) { console.error(error); return }
        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast', event: 'new_message',
                payload: { sender_id: user.id, sender_name: user.user_metadata?.username || 'alguien', preview: newMessage.trim().slice(0, 60) }
            })
        }
        await supabase.channel('conversations-list').send({ type: 'broadcast', event: 'new_message', payload: {} })
        setNewMessage('')
    }

    // Flujo eliminar: click → modal → confirmación → RPC
    const confirmDelete = (messageId) => setDeleteConfirm(messageId)
    const doDelete = async () => {
        const { error } = await supabase.rpc('delete_message', { p_message_id: deleteConfirm })
        if (!error) await getMessages()
        setDeleteConfirm(null)
    }

    // Flujo editar: click ✏️ → input inline → Enter/✓ → modal → confirmación → RPC
    const startEdit = (msg) => { setEditingId(msg.id); setEditContent(msg.content) }
    const requestEditConfirm = () => {
        if (!editContent.trim() || editContent === messages.find(m => m.id === editingId)?.content) {
            setEditingId(null); return
        }
        setEditConfirm({ id: editingId, newContent: editContent.trim() })
    }
    const doEdit = async () => {
        const { error } = await supabase.rpc('edit_message', { p_message_id: editConfirm.id, p_new_content: editConfirm.newContent })
        if (!error) { setEditingId(null); setEditContent(''); await getMessages() }
        setEditConfirm(null)
    }

    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
    const handleEditKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); requestEditConfirm() }
        if (e.key === 'Escape') { setEditingId(null); setEditContent('') }
    }

    const handleBlockToggle = async () => {
        if (!otherUserId) return
        isBlocked(otherUserId) ? await unblockUser(otherUserId) : await blockUser(otherUserId)
        setShowMenu(false)
    }
    const handleMuteToggle = () => { toggleMute(id); setShowMenu(false) }

    const blocked = otherUserId ? isBlocked(otherUserId) : false
    const muted = isMuted(id)

    // ── Estilos globales ──
    const css = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2e2e33; border-radius: 4px; }
        .msg-bubble { transition: filter .15s; }
        .msg-bubble:hover { filter: brightness(1.08); }
        .msg-actions { opacity: 0; transition: opacity .15s; }
        .msg-row:hover .msg-actions { opacity: 1; }
        .action-btn { transition: background .15s, color .15s; }
        .action-btn:hover { background: rgba(255,255,255,.12) !important; }
        .send-btn { transition: background .15s, transform .1s; }
        .send-btn:hover:not(:disabled) { background: #2563eb !important; }
        .send-btn:active:not(:disabled) { transform: scale(.96); }
        .menu-item { transition: background .12s; }
        .menu-item:hover { background: #27272a !important; }
        @keyframes msgIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        .msg-anim { animation: msgIn .2s ease; }
    `

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f10', fontFamily: "'DM Sans', sans-serif", color: '#71717a' }}>
            <style>{css}</style>
            <div style={{ textAlign: 'center', gap: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid #27272a', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                <span style={{ fontSize: '14px' }}>Cargando conversación...</span>
            </div>
        </div>
    )

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", background: '#0f0f10', fontFamily: "'DM Sans', sans-serif", color: '#f4f4f5' }}>
            <style>{css}</style>

            {/* ── Modales de confirmación ── */}
            {deleteConfirm && (
                <ConfirmModal
                    title="¿Eliminar mensaje?"
                    message="Esta acción no se puede deshacer. El mensaje será reemplazado por '[Mensaje eliminado]'."
                    confirmLabel="Eliminar"
                    confirmColor="#ef4444"
                    onConfirm={doDelete}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}
            {editConfirm && (
                <ConfirmModal
                    title="¿Guardar cambios?"
                    message="El mensaje será actualizado y se mostrará como editado."
                    confirmLabel="Guardar"
                    confirmColor="#3b82f6"
                    onConfirm={doEdit}
                    onCancel={() => setEditConfirm(null)}
                >
                    <div style={{ background: '#27272a', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', color: '#a1a1aa', fontStyle: 'italic', wordBreak: 'break-word' }}>
                        "{editConfirm.newContent}"
                    </div>
                </ConfirmModal>
            )}

            {/* ── Header ── */}
            <div style={{
                padding: '14px 18px', borderBottom: '1px solid #1c1c1f',
                display: 'flex', alignItems: 'center', gap: '12px',
                background: '#111113', backdropFilter: 'blur(12px)'
            }}>
                <button onClick={() => navigate('/conversations')} style={{
                    background: '#1c1c1f', border: '1px solid #2e2e33', color: '#a1a1aa',
                    borderRadius: '10px', padding: '7px 12px', cursor: 'pointer',
                    fontSize: '14px', fontFamily: 'inherit', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: '4px', transition: 'border-color .15s'
                }}>← Volver</button>

                {/* Avatar + nombre */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: 600, color: 'white', flexShrink: 0
                    }}>
                        {(conversation?.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', lineHeight: 1.2 }}>
                            {conversation?.name || 'Sin nombre'}
                        </div>
                        {muted && <div style={{ fontSize: '11px', color: '#52525b' }}>🔕 Silenciado</div>}
                        {blocked && <div style={{ fontSize: '11px', color: '#7f1d1d' }}>🚫 Bloqueado</div>}
                    </div>
                </div>

                {/* Botón de notificaciones */}
                {notifPermission !== 'granted' && (
                    <button onClick={() => Notification.requestPermission().then(p => setNotifPermission(p))}
                        style={{ fontSize: '12px', padding: '6px 10px', background: '#1c1c1f', border: '1px solid #2e2e33', color: '#71717a', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        🔔 Activar alertas
                    </button>
                )}

                {/* Menú ⋮ */}
                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowMenu(prev => !prev)} style={{
                        background: showMenu ? '#27272a' : 'transparent', border: '1px solid #2e2e33',
                        color: '#a1a1aa', borderRadius: '10px', width: '36px', height: '36px',
                        cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', transition: 'background .15s'
                    }}>⋮</button>
                    {showMenu && (
                        <div style={{
                            position: 'absolute', right: 0, top: '44px', background: '#18181b',
                            border: '1px solid #2e2e33', borderRadius: '12px', padding: '6px',
                            zIndex: 100, minWidth: '200px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
                        }}>
                            <button className="menu-item" onClick={handleMuteToggle} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                width: '100%', padding: '10px 12px', background: 'none',
                                border: 'none', color: '#e4e4e7', cursor: 'pointer',
                                textAlign: 'left', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit'
                            }}>
                                <span>{muted ? '🔔' : '🔕'}</span>
                                {muted ? 'Activar notificaciones' : 'Silenciar notificaciones'}
                            </button>
                            {conversation?.type === 'direct' && otherUserId && (
                                <button className="menu-item" onClick={handleBlockToggle} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    width: '100%', padding: '10px 12px', background: 'none',
                                    border: 'none', color: blocked ? '#4ade80' : '#f87171',
                                    cursor: 'pointer', textAlign: 'left', borderRadius: '8px',
                                    fontSize: '14px', fontFamily: 'inherit'
                                }}>
                                    <span>{blocked ? '✅' : '🚫'}</span>
                                    {blocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Banner bloqueado ── */}
            {blocked && (
                <div style={{ padding: '10px 18px', background: '#1c0a0a', borderBottom: '1px solid #2d1010', color: '#f87171', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>
                    🚫 Has bloqueado a este usuario. No puedes enviar ni recibir sus mensajes.
                </div>
            )}

            {/* ── Lista de mensajes ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#3f3f46', gap: '8px' }}>
                        <span style={{ fontSize: '36px' }}>💬</span>
                        <p style={{ margin: 0, fontSize: '14px' }}>No hay mensajes aún. ¡Escribe algo!</p>
                    </div>
                ) : (
                    messages
                        .filter(msg => !blocked || msg.sender_id === currentUser?.id)
                        .map((msg, i) => {
                            const isOwn = msg.sender_id === currentUser?.id
                            const isDeleted = msg.is_deleted
                            const isEditing = editingId === msg.id
                            const prevMsg = messages[i - 1]
                            const showUsername = !isOwn && !isDeleted && (!prevMsg || prevMsg.sender_id !== msg.sender_id)

                            return (
                                <div key={msg.id} className="msg-row msg-anim"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: '2px', marginTop: i > 0 && prevMsg?.sender_id !== msg.sender_id ? '10px' : '2px' }}>

                                    {/* Username sobre el primer mensaje del grupo */}
                                    {showUsername && (
                                        <span style={{ fontSize: '11px', color: '#52525b', marginLeft: '12px', fontWeight: 500 }}>
                                            {msg.profiles?.username}
                                        </span>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: isOwn ? 'row-reverse' : 'row', maxWidth: '72%' }}>

                                        {/* Burbuja */}
                                        <div className="msg-bubble" style={{
                                            background: isDeleted ? '#18181b' : isOwn
                                                ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                                                : '#1c1c1f',
                                            border: isDeleted ? '1px solid #27272a' : isOwn ? 'none' : '1px solid #27272a',
                                            color: isDeleted ? '#52525b' : '#f4f4f5',
                                            padding: isEditing ? '8px 10px' : '10px 14px',
                                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            fontStyle: isDeleted ? 'italic' : 'normal',
                                            fontSize: '14px', lineHeight: '1.5',
                                            boxShadow: isOwn && !isDeleted ? '0 2px 12px rgba(37,99,235,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                                            wordBreak: 'break-word'
                                        }}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: '220px' }}>
                                                    <input
                                                        autoFocus
                                                        value={editContent}
                                                        onChange={e => setEditContent(e.target.value)}
                                                        onKeyDown={handleEditKeyDown}
                                                        style={{ flex: 1, padding: '5px 10px', borderRadius: '8px', border: '1px solid #3b82f6', background: '#0f0f10', color: 'white', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                                                    />
                                                    <button onClick={requestEditConfirm} style={{ width: '28px', height: '28px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                                                    <button onClick={() => setEditingId(null)} style={{ width: '28px', height: '28px', background: '#27272a', border: 'none', borderRadius: '8px', color: '#a1a1aa', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                                </div>
                                            ) : (
                                                <span>{msg.content}</span>
                                            )}
                                        </div>

                                        {/* Botones de acción flotantes */}
                                        {isOwn && !isDeleted && !isEditing && (
                                            <div className="msg-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center', paddingBottom: '4px' }}>
                                                <button className="action-btn" onClick={() => startEdit(msg)} title="Editar" style={{
                                                    width: '26px', height: '26px', border: '1px solid #2e2e33',
                                                    background: '#18181b', borderRadius: '7px', cursor: 'pointer',
                                                    fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>✏️</button>
                                                <button className="action-btn" onClick={() => confirmDelete(msg.id)} title="Eliminar" style={{
                                                    width: '26px', height: '26px', border: '1px solid #2d1010',
                                                    background: '#18181b', borderRadius: '7px', cursor: 'pointer',
                                                    fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>🗑️</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Meta: hora + editado + leído */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingInline: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#3f3f46' }}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.is_edited && !isDeleted && (
                                            <span style={{ fontSize: '11px', color: '#3f3f46' }}>· editado</span>
                                        )}
                                        {isOwn && !isDeleted && (
                                            <span title={msg.read_count > 0 ? 'Leído' : 'Enviado'}
                                                style={{ fontSize: '12px', color: msg.read_count > 0 ? '#3b82f6' : '#3f3f46', fontWeight: 600 }}>
                                                {msg.read_count > 0 ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input de mensaje ── */}
            <div style={{ padding: '14px 18px', borderTop: '1px solid #1c1c1f', background: '#111113', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={blocked ? 'No puedes enviar mensajes a este usuario' : 'Escribe un mensaje…'}
                    disabled={blocked}
                    style={{
                        flex: 1, padding: '11px 16px', borderRadius: '14px',
                        border: '1px solid #2e2e33', background: '#18181b',
                        color: blocked ? '#52525b' : '#f4f4f5', fontSize: '14px',
                        fontFamily: 'inherit', outline: 'none', transition: 'border-color .15s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#2e2e33'}
                />
                <button className="send-btn" onClick={sendMessage} disabled={blocked || !newMessage.trim()} style={{
                    padding: '11px 20px', borderRadius: '14px', border: 'none',
                    background: blocked || !newMessage.trim() ? '#1c1c1f' : '#3b82f6',
                    color: blocked || !newMessage.trim() ? '#52525b' : 'white',
                    cursor: blocked || !newMessage.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontFamily: 'inherit', fontWeight: 600,
                    transition: 'background .15s, color .15s'
                }}>Enviar</button>
            </div>
        </div>
    )
}

export default Chat