import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { useParams, useNavigate } from "react-router-dom"
import useBlockedUsers from "../hooks/useBlockedUsers"
import useMutedConversations from "../hooks/useMutedConversations"
import CallModal from "../components/CallModal"

/* ─── Modal de confirmación genérico ─── */
function ConfirmModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, children }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn .15s ease'
        }}>
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
                        fontSize: '14px', fontFamily: 'inherit', fontWeight: 500
                    }}>Cancelar</button>
                    <button onClick={onConfirm} style={{
                        padding: '9px 18px', borderRadius: '10px', border: 'none',
                        background: confirmColor || '#ef4444', color: 'white', cursor: 'pointer',
                        fontSize: '14px', fontFamily: 'inherit', fontWeight: 600
                    }}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    )
}

/* ─── Emoji Picker simple ─── */
const EMOJIS = ['😀','😂','😍','🥰','😎','🤔','😢','😡','👍','👎','❤️','🔥','🎉','✨','💯','🙏','😭','🤣','😊','😏','🥺','😴','🤯','💀','👀','🫡','💪','🎶','🍕','🚀']

function EmojiPicker({ onSelect, onClose }) {
    return (
        <div style={{
            position: 'absolute', bottom: '56px', left: 0, zIndex: 200,
            background: '#18181b', border: '1px solid #2e2e33', borderRadius: '14px',
            padding: '12px', width: '260px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px'
        }}>
            {EMOJIS.map(e => (
                <button key={e} onClick={() => onSelect(e)} style={{
                    background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
                    padding: '6px', borderRadius: '8px', transition: 'background .1s'
                }}
                    onMouseEnter={ev => ev.target.style.background = '#27272a'}
                    onMouseLeave={ev => ev.target.style.background = 'none'}
                >{e}</button>
            ))}
        </div>
    )
}

/* ─── Modal de personalización de chat ─── */
const BG_OPTIONS = [
    { label: 'Oscuro (default)', value: '#0f0f10' },
    { label: 'Azul noche', value: '#0a0f1e' },
    { label: 'Verde bosque', value: '#0a1209' },
    { label: 'Morado', value: '#100a1e' },
    { label: 'Marrón cálido', value: '#1a1208' },
    { label: 'Gris pizarra', value: '#111518' },
]

function CustomizeModal({ nickname, bg, onSave, onClose }) {
    const [nick, setNick] = useState(nickname || '')
    const [bgVal, setBgVal] = useState(bg || '#0f0f10')
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#18181b', border: '1px solid #2e2e33', borderRadius: '16px', padding: '28px 24px', width: '360px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', fontFamily: "'DM Sans', sans-serif" }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 600, color: '#f4f4f5' }}>✏️ Personalizar chat</h3>

                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>Apodo del contacto</label>
                <input value={nick} onChange={e => setNick(e.target.value)} placeholder="Ej: Mi mejor amigo"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #2e2e33', background: '#111113', color: '#f4f4f5', fontSize: '14px', fontFamily: 'inherit', outline: 'none', marginBottom: '18px', boxSizing: 'border-box' }} />

                <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: '#a1a1aa' }}>Fondo del chat</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                    {BG_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => setBgVal(opt.value)} style={{
                            padding: '10px 12px', borderRadius: '10px', border: `2px solid ${bgVal === opt.value ? '#3b82f6' : '#2e2e33'}`,
                            background: opt.value, color: '#f4f4f5', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                            fontWeight: bgVal === opt.value ? 600 : 400, transition: 'border-color .15s', textAlign: 'left'
                        }}>{opt.label}</button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid #2e2e33', background: 'transparent', color: '#a1a1aa', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Cancelar</button>
                    <button onClick={() => onSave(nick, bgVal)} style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600 }}>Guardar</button>
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
    const [otherUserAvatar, setOtherUserAvatar] = useState(null)
    const [showMenu, setShowMenu] = useState(false)

    // Editar
    const [editingId, setEditingId] = useState(null)
    const [editContent, setEditContent] = useState('')

    // Modales de confirmación
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [editConfirm, setEditConfirm] = useState(null)

    // Fijar mensajes
    const [pinnedMessages, setPinnedMessages] = useState([])
    const [showPinned, setShowPinned] = useState(false)

    // Notificaciones
    const [notifPermission, setNotifPermission] = useState(Notification.permission)

    // Emoji picker
    const [showEmoji, setShowEmoji] = useState(false)

    // Adjuntar foto
    const fileInputRef = useRef(null)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)

    // Personalización
    const [showCustomize, setShowCustomize] = useState(false)
    const [chatNickname, setChatNickname] = useState('')
    const [chatBg, setChatBg] = useState('#0f0f10')

    // Llamadas / Videollamadas
    const [callState, setCallState] = useState(null)
    // callState: null | { mode, isIncoming, offer, otherUserName }

    const channelRef = useRef(null)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    const { blockUser, unblockUser, isBlocked } = useBlockedUsers()
    const { toggleMute, isMuted } = useMutedConversations()

    // Cargar personalización guardada
    useEffect(() => {
        // Esperamos a tener el usuario para usar su ID en la clave
    }, [id])

    useEffect(() => {
        if (!currentUser) return
        const saved = localStorage.getItem(`chat_custom_${currentUser.id}_${id}`)
        if (saved) {
            try {
                const { nickname, bg } = JSON.parse(saved)
                if (nickname) setChatNickname(nickname)
                if (bg) setChatBg(bg)
            } catch (_) {}
        }
    }, [id, currentUser])

    useEffect(() => {
        let channel
        let profileChannel
        let callChannel
        const run = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
            await getConversation(user)
            await getMessages()
            await getPinnedMessages()
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

            // ── Escuchar cambios de foto de perfil en tiempo real ──
            // Usamos el canal de la conversación para re-cargar el avatar del otro usuario
            profileChannel = supabase
                .channel(`profiles-${id}`)
                .on('postgres_changes', {
                    event: 'UPDATE', schema: 'public', table: 'profiles'
                }, (payload) => {
                    if (payload.new?.id && payload.new.id !== user.id) {
                        // El otro usuario actualizó su perfil
                        if (payload.new.avatar_url) setOtherUserAvatar(payload.new.avatar_url)
                    }
                })
                .subscribe()

            // ── Escuchar llamadas entrantes ──
            // Usamos canal por usuario destino (no por conversación) para evitar colisión con CallModal
            callChannel = supabase
                .channel(`incoming-call-${user.id}`, { config: { broadcast: { self: false } } })
                .on('broadcast', { event: 'call_offer' }, ({ payload }) => {
                    if (payload?.callerName && payload?.sdp && payload?.conversationId === id) {
                        setCallState({
                            mode: payload.mode || 'audio',
                            isIncoming: true,
                            offer: payload.sdp,
                            otherUserName: payload.callerName,
                        })
                    }
                })
                .subscribe()
        }
        run()
        return () => {
            if (channel) supabase.removeChannel(channel)
            if (profileChannel) supabase.removeChannel(profileChannel)
            if (callChannel) supabase.removeChannel(callChannel)
        }
    }, [id])

    const messagesContainerRef = useRef(null)
    const isFirstLoad = useRef(true)

    useEffect(() => {
        if (messages.length === 0) return
        // requestAnimationFrame garantiza que el DOM ya renderizó los mensajes
        requestAnimationFrame(() => {
            const container = messagesContainerRef.current
            if (!container) return
            container.scrollTop = container.scrollHeight
            if (isFirstLoad.current) isFirstLoad.current = false
        })
    }, [messages])

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(p => setNotifPermission(p))
        }
    }, [])

    useEffect(() => {
        const close = () => setShowMenu(false)
        if (showMenu) document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [showMenu])

    useEffect(() => {
        const close = () => setShowEmoji(false)
        if (showEmoji) document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [showEmoji])

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
                if (otherId) {
                    setOtherUserId(otherId)
                    // Cargar avatar del otro usuario
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('avatar_url')
                        .eq('id', otherId)
                        .single()
                    if (profile?.avatar_url) setOtherUserAvatar(profile.avatar_url)
                }
            }
        }
    }

    const getMessages = async () => {
        const { data } = await supabase.rpc('get_messages', { p_conversation_id: id })
        if (data) {
            setMessages(data.map(msg => ({
                id: msg.id,
                // Guardar contenido original para renderizado, pero limpiar si es foto
                content: msg.content,
                displayContent: msg.content?.startsWith('[foto]') ? '📷 Foto' : msg.content,
                created_at: msg.created_at,
                sender_id: msg.sender_id, profiles: { username: msg.username, avatar_url: msg.avatar_url },
                is_deleted: msg.is_deleted, is_edited: msg.is_edited,
                edited_at: msg.edited_at, read_count: msg.read_count,
                pinned_at: msg.pinned_at, image_url: msg.image_url
            })))
            await supabase.rpc('mark_messages_read', { p_conversation_id: id })
        }
    }

    const getPinnedMessages = async () => {
        const { data } = await supabase.rpc('get_pinned_messages', { p_conversation_id: id })
        if (data) setPinnedMessages(data)
    }

    const pinMessage = async (messageId) => {
        await supabase.rpc('pin_message', { p_message_id: messageId })
        await getPinnedMessages()
        await getMessages()
    }

    const unpinMessage = async (messageId) => {
        await supabase.rpc('unpin_message', { p_message_id: messageId })
        await getPinnedMessages()
        await getMessages()
    }

    /* ── Helper: enviar mensaje resolviendo ambigüedad de RPC ── */
    const insertMessage = async (content) => {
        // Intentar con p_image_url explícito para resolver overload PGRST203
        const { error } = await supabase.rpc('send_message', {
            p_conversation_id: id,
            p_content: content,
            p_image_url: null
        })
        if (!error) return null

        // Fallback: insert directo si el RPC no tiene p_image_url
        console.warn('Fallback a insert directo:', error.message)
        const { error: insertError } = await supabase.from('messages').insert({
            conversation_id: id,
            sender_id: currentUser.id,
            content: content,
        })
        return insertError
    }

    /* ── SEND MESSAGE ── */
    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUser) return
        const text = newMessage.trim()
        setNewMessage('')

        const error = await insertMessage(text)
        if (error) { console.error('send_message error:', error); setNewMessage(text); return }

        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast', event: 'new_message',
                payload: {
                    sender_id: currentUser.id,
                    sender_name: currentUser.user_metadata?.username || 'alguien',
                    preview: text.slice(0, 60)
                }
            })
        }
        await getMessages()
    }

    /* ── ENVIAR FOTO ── */
    const handlePhotoSend = async (e) => {
        const file = e.target.files?.[0]
        if (!file || !currentUser) return
        setUploadingPhoto(true)
        try {
            const ext = file.name.split('.').pop()
            const path = `chat-photos/${id}/${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
            if (upErr) throw upErr
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
            const photoUrl = urlData.publicUrl

            const error = await insertMessage(`[foto]${photoUrl}`)
            if (!error) {
                if (channelRef.current) {
                    await channelRef.current.send({
                        type: 'broadcast', event: 'new_message',
                        payload: { sender_id: currentUser.id, sender_name: currentUser.user_metadata?.username || 'alguien', preview: '📷 Foto' }
                    })
                }
                await getMessages()
            }
        } catch (err) {
            console.error('Error subiendo foto:', err)
        } finally {
            setUploadingPhoto(false)
            e.target.value = ''
        }
    }

    /* ── PERSONALIZACIÓN ── */
    const saveCustomize = (nick, bg) => {
        setChatNickname(nick)
        setChatBg(bg)
        const key = `chat_custom_${currentUser?.id}_${id}`
        localStorage.setItem(key, JSON.stringify({ nickname: nick, bg }))
        setShowCustomize(false)
    }

    // Flujo eliminar
    const confirmDelete = (messageId) => setDeleteConfirm(messageId)
    const doDelete = async () => {
        const { error } = await supabase.rpc('delete_message', { p_message_id: deleteConfirm })
        if (!error) await getMessages()
        setDeleteConfirm(null)
    }

    // Flujo editar
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

    /* ── Iniciar llamada saliente ── */
    const startOutgoingCall = (mode) => {
        if (blocked || !otherUserId) return
        setCallState({
            mode,
            isIncoming: false,
            offer: null,
            otherUserName: displayName,
            targetUserId: otherUserId,   // necesario para que CallModal sepa a dónde enviar la oferta
        })
    }

    const handleBlockToggle = async () => {
        if (!otherUserId) return
        isBlocked(otherUserId) ? await unblockUser(otherUserId) : await blockUser(otherUserId)
        setShowMenu(false)
    }
    const handleMuteToggle = () => { toggleMute(id); setShowMenu(false) }

    const blocked = otherUserId ? isBlocked(otherUserId) : false
    const muted = isMuted(id)

    const displayName = chatNickname || conversation?.name || 'Sin nombre'

    /* ── Renderizar contenido de mensaje (texto o foto) ── */
    const renderContent = (msg) => {
        if (msg.is_deleted) return <span style={{ fontStyle: 'italic', color: '#52525b' }}>[Mensaje eliminado]</span>
        if (msg.content?.startsWith('[foto]')) {
            const url = msg.content.slice(6) // quita exactamente '[foto]'
            return (
                <span style={{ display: 'inline-block' }}>
                    <img src={url} alt="📷 Foto"
                        style={{ maxWidth: '220px', maxHeight: '260px', borderRadius: '10px', display: 'block', cursor: 'pointer' }}
                        onClick={() => window.open(url, '_blank')}
                        onError={e => {
                            e.target.style.display = 'none'
                            const fallback = e.target.parentElement?.querySelector('.foto-fallback')
                            if (fallback) fallback.style.display = 'block'
                        }}
                    />
                    <span className="foto-fallback" style={{ display: 'none', fontSize: '13px', color: '#71717a', fontStyle: 'italic' }}>
                        📷 Imagen no disponible
                    </span>
                </span>
            )
        }
        return <span>{msg.content}</span>
    }

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
        .icon-btn:hover { background: #27272a !important; }
        .menu-item { transition: background .12s; }
        .menu-item:hover { background: #27272a !important; }
        @keyframes msgIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0; transform:scale(.96) } to { opacity:1; transform:scale(1) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
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
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", background: chatBg, fontFamily: "'DM Sans', sans-serif", color: '#f4f4f5' }}>
            <style>{css}</style>

            {deleteConfirm && (
                <ConfirmModal
                    title="¿Eliminar mensaje?"
                    message="Esta acción no se puede deshacer. El mensaje será reemplazado por '[Mensaje eliminado]'."
                    confirmLabel="Eliminar" confirmColor="#ef4444"
                    onConfirm={doDelete} onCancel={() => setDeleteConfirm(null)}
                />
            )}
            {editConfirm && (
                <ConfirmModal
                    title="¿Guardar cambios?"
                    message="El mensaje será actualizado y se mostrará como editado."
                    confirmLabel="Guardar" confirmColor="#3b82f6"
                    onConfirm={doEdit} onCancel={() => setEditConfirm(null)}
                >
                    <div style={{ background: '#27272a', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', color: '#a1a1aa', fontStyle: 'italic', wordBreak: 'break-word' }}>
                        "{editConfirm.newContent}"
                    </div>
                </ConfirmModal>
            )}
            {showCustomize && (
                <CustomizeModal
                    nickname={chatNickname} bg={chatBg}
                    onSave={saveCustomize} onClose={() => setShowCustomize(false)}
                />
            )}

            {/* ── Modal de llamada / videollamada ── */}
            {callState && (
                <CallModal
                    conversationId={id}
                    currentUser={currentUser}
                    otherUserName={callState.otherUserName}
                    targetUserId={callState.targetUserId || null}
                    mode={callState.mode}
                    isIncoming={callState.isIncoming}
                    offer={callState.offer}
                    onClose={() => setCallState(null)}
                />
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
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>← Volver</button>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: 600, color: 'white', flexShrink: 0,
                        overflow: 'hidden'
                    }}>
                        {otherUserAvatar
                            ? <img src={otherUserAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setOtherUserAvatar(null)} />
                            : (displayName || '?')[0].toUpperCase()
                        }
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', lineHeight: 1.2 }}>
                            {displayName}
                            {chatNickname && conversation?.name && chatNickname !== conversation.name && (
                                <span style={{ fontSize: '11px', color: '#52525b', marginLeft: '6px', fontWeight: 400 }}>({conversation.name})</span>
                            )}
                        </div>
                        {muted && <div style={{ fontSize: '11px', color: '#52525b' }}>🔕 Silenciado</div>}
                        {blocked && <div style={{ fontSize: '11px', color: '#7f1d1d' }}>🚫 Bloqueado</div>}
                    </div>
                </div>

                {notifPermission !== 'granted' && (
                    <button onClick={() => Notification.requestPermission().then(p => setNotifPermission(p))}
                        style={{ fontSize: '12px', padding: '6px 10px', background: '#1c1c1f', border: '1px solid #2e2e33', color: '#71717a', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        🔔 Activar alertas
                    </button>
                )}

                {/* Botón llamada de voz */}
                {conversation?.type === 'direct' && !blocked && (
                    <button className="icon-btn" onClick={() => startOutgoingCall('audio')} title="Llamada de voz"
                        style={{
                            background: 'transparent', border: '1px solid #2e2e33', color: '#a1a1aa',
                            borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer',
                            fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s'
                        }}>📞</button>
                )}

                {/* Botón videollamada */}
                {conversation?.type === 'direct' && !blocked && (
                    <button className="icon-btn" onClick={() => startOutgoingCall('video')} title="Videollamada"
                        style={{
                            background: 'transparent', border: '1px solid #2e2e33', color: '#a1a1aa',
                            borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer',
                            fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s'
                        }}>🎥</button>
                )}

                {/* Botón personalizar */}
                <button className="icon-btn" onClick={() => setShowCustomize(true)} title="Personalizar chat" style={{
                    background: 'transparent', border: '1px solid #2e2e33', color: '#a1a1aa',
                    borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer',
                    fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s'
                }}>🎨</button>

                {/* Menú ⋮ */}
                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowMenu(prev => !prev)} style={{
                        background: showMenu ? '#27272a' : 'transparent', border: '1px solid #2e2e33',
                        color: '#a1a1aa', borderRadius: '10px', width: '36px', height: '36px',
                        cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>⋮</button>
                    {showMenu && (
                        <div style={{
                            position: 'absolute', right: 0, top: '44px', background: '#18181b',
                            border: '1px solid #2e2e33', borderRadius: '12px', padding: '6px',
                            zIndex: 100, minWidth: '200px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
                        }}>
                            {pinnedMessages.length > 0 && (
                                <button className="menu-item" onClick={() => { setShowPinned(true); setShowMenu(false) }} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    width: '100%', padding: '10px 12px', background: 'none',
                                    border: 'none', color: '#e4e4e7', cursor: 'pointer',
                                    textAlign: 'left', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit'
                                }}>
                                    <span>📌</span> Ver fijados ({pinnedMessages.length})
                                </button>
                            )}
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

            {blocked && (
                <div style={{ padding: '10px 18px', background: '#1c0a0a', borderBottom: '1px solid #2d1010', color: '#f87171', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>
                    🚫 Has bloqueado a este usuario. No puedes enviar ni recibir sus mensajes.
                </div>
            )}

            {pinnedMessages.length > 0 && (
                <div onClick={() => setShowPinned(true)}
                    style={{ padding: '9px 18px', background: '#1a1a0f', borderBottom: '1px solid #3b3200', color: '#f59e0b', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📌</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pinnedMessages.length} mensaje{pinnedMessages.length > 1 ? 's' : ''} fijado{pinnedMessages.length > 1 ? 's' : ''} · "{pinnedMessages[0]?.content?.slice(0, 50)}{pinnedMessages[0]?.content?.length > 50 ? '…' : ''}"
                    </span>
                    <span style={{ fontSize: '11px', color: '#a16207' }}>Ver todos →</span>
                </div>
            )}

            {showPinned && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#18181b', border: '1px solid #2e2e33', borderRadius: '16px', padding: '24px', width: '420px', maxWidth: '92vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>📌 Mensajes fijados</h3>
                            <button onClick={() => setShowPinned(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
                        </div>
                        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {pinnedMessages.map(pm => (
                                <div key={pm.id} style={{ background: '#111113', border: '1px solid #2e2e33', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: '#52525b', marginBottom: '4px', fontWeight: 500 }}>@{pm.username} · fijado por @{pm.pinner_name}</div>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#e4e4e7', lineHeight: 1.5, wordBreak: 'break-word' }}>{pm.content}</p>
                                    </div>
                                    <button onClick={() => { unpinMessage(pm.id); if (pinnedMessages.length <= 1) setShowPinned(false) }} style={{ background: '#2e2e33', border: 'none', borderRadius: '7px', color: '#f59e0b', cursor: 'pointer', padding: '5px 8px', fontSize: '13px', flexShrink: 0, fontFamily: 'inherit' }}>Desfijar</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lista de mensajes ── */}
            <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                            const isPhoto = msg.content?.startsWith('[foto]')

                            return (
                                <div key={msg.id} className="msg-row msg-anim"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: '2px', marginTop: i > 0 && prevMsg?.sender_id !== msg.sender_id ? '10px' : '2px' }}>

                                    {showUsername && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '12px' }}>
                                            {msg.profiles?.avatar_url && (
                                                <img src={msg.profiles.avatar_url} alt=""
                                                    style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                                    onError={e => e.target.style.display = 'none'}
                                                />
                                            )}
                                            <span style={{ fontSize: '11px', color: '#52525b', fontWeight: 500 }}>
                                                {msg.profiles?.username}
                                            </span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: isOwn ? 'row-reverse' : 'row', maxWidth: '72%' }}>
                                        <div className="msg-bubble" style={{
                                            background: isDeleted ? '#18181b' : isOwn
                                                ? (isPhoto ? '#1c1c1f' : 'linear-gradient(135deg, #2563eb, #3b82f6)')
                                                : '#1c1c1f',
                                            border: isDeleted ? '1px solid #27272a' : isOwn && !isPhoto ? 'none' : '1px solid #27272a',
                                            color: isDeleted ? '#52525b' : '#f4f4f5',
                                            padding: isEditing ? '8px 10px' : isPhoto ? '6px' : '10px 14px',
                                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            fontSize: '14px', lineHeight: '1.5',
                                            boxShadow: isOwn && !isDeleted && !isPhoto ? '0 2px 12px rgba(37,99,235,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                                            wordBreak: 'break-word'
                                        }}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: '220px' }}>
                                                    <input autoFocus value={editContent} onChange={e => setEditContent(e.target.value)} onKeyDown={handleEditKeyDown}
                                                        style={{ flex: 1, padding: '5px 10px', borderRadius: '8px', border: '1px solid #3b82f6', background: '#0f0f10', color: 'white', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
                                                    <button onClick={requestEditConfirm} style={{ width: '28px', height: '28px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                                                    <button onClick={() => setEditingId(null)} style={{ width: '28px', height: '28px', background: '#27272a', border: 'none', borderRadius: '8px', color: '#a1a1aa', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                                </div>
                                            ) : renderContent(msg)}
                                        </div>

                                        {isOwn && !isDeleted && !isEditing && (
                                            <div className="msg-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center', paddingBottom: '4px' }}>
                                                <button className="action-btn" onClick={() => msg.pinned_at ? unpinMessage(msg.id) : pinMessage(msg.id)} title={msg.pinned_at ? 'Desfijar' : 'Fijar'} style={{
                                                    width: '26px', height: '26px', border: `1px solid ${msg.pinned_at ? '#3b3200' : '#2e2e33'}`,
                                                    background: '#18181b', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>{msg.pinned_at ? '📍' : '📌'}</button>
                                                {!isPhoto && <button className="action-btn" onClick={() => startEdit(msg)} title="Editar" style={{
                                                    width: '26px', height: '26px', border: '1px solid #2e2e33',
                                                    background: '#18181b', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>✏️</button>}
                                                <button className="action-btn" onClick={() => confirmDelete(msg.id)} title="Eliminar" style={{
                                                    width: '26px', height: '26px', border: '1px solid #2d1010',
                                                    background: '#18181b', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>🗑️</button>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingInline: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#3f3f46' }}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.is_edited && !isDeleted && <span style={{ fontSize: '11px', color: '#3f3f46' }}>· editado</span>}
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
            <div style={{ padding: '12px 18px', borderTop: '1px solid #1c1c1f', background: '#111113' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                    {/* Input oculto para fotos */}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoSend} style={{ display: 'none' }} />

                    {/* Botón adjuntar foto */}
                    <button className="icon-btn" onClick={() => !blocked && fileInputRef.current?.click()} disabled={blocked || uploadingPhoto}
                        title="Adjuntar foto" style={{
                            width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #2e2e33',
                            background: '#1c1c1f', color: uploadingPhoto ? '#52525b' : '#a1a1aa', cursor: blocked ? 'not-allowed' : 'pointer',
                            fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s'
                        }}>
                        {uploadingPhoto ? '⏳' : '📷'}
                    </button>

                    {/* Botón emoji */}
                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button className="icon-btn" onClick={() => !blocked && setShowEmoji(p => !p)} disabled={blocked}
                            title="Emojis" style={{
                                width: '38px', height: '38px', borderRadius: '10px', border: `1px solid ${showEmoji ? '#3b82f6' : '#2e2e33'}`,
                                background: showEmoji ? '#27272a' : '#1c1c1f', color: '#a1a1aa', cursor: blocked ? 'not-allowed' : 'pointer',
                                fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s'
                            }}>😊</button>
                        {showEmoji && (
                            <EmojiPicker
                                onSelect={e => {
                                    setNewMessage(prev => prev + e)
                                    setShowEmoji(false)
                                    inputRef.current?.focus()
                                }}
                                onClose={() => setShowEmoji(false)}
                            />
                        )}
                    </div>

                    {/* Campo de texto */}
                    <input
                        ref={inputRef}
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

                    {/* Botón enviar */}
                    <button className="send-btn" onClick={sendMessage} disabled={blocked || !newMessage.trim()} style={{
                        padding: '11px 20px', borderRadius: '14px', border: 'none',
                        background: blocked || !newMessage.trim() ? '#1c1c1f' : '#3b82f6',
                        color: blocked || !newMessage.trim() ? '#52525b' : 'white',
                        cursor: blocked || !newMessage.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontFamily: 'inherit', fontWeight: 600,
                        transition: 'background .15s, color .15s', flexShrink: 0
                    }}>Enviar</button>
                </div>
            </div>
        </div>
    )
}

export default Chat