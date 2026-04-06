import { useState, useEffect, useRef} from "react"
import { supabase } from "../lib/supabase"
import { useParams, useNavigate } from "react-router-dom"

function Chat() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [conversation, setConversation] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const channelRef = useRef(null)

    useEffect(() => {
    let channel

    const run = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        await getConversation()
        await getMessages()
        setLoading(false)

        channel = supabase
    .channel(`chat-${id}`, {
        config: {
            broadcast: { self: true }
        }
    })
    .on('broadcast', { event: 'new_message' }, async () => {
        await getMessages()
    })
    .subscribe((status) => {
    })

channelRef.current = channel
    }

    run()

    return () => {
        if (channel) supabase.removeChannel(channel)
    }
}, [id])

    const getConversation = async () => {
    const { data } = await supabase
        .from('conversations')
        .select('id, name, type')
        .eq('id', id)
        .single()

    if (data) {
        const { data: conversationName } = await supabase
            .rpc('get_conversation_name', { p_conversation_id: id })

        data.name = conversationName
        setConversation(data)
    }
}

    const getMessages = async () => {
        const { data } = await supabase
            .rpc('get_messages', { p_conversation_id: id })

        if (data) {
            const formatted = data.map(msg => ({
                id: msg.id,
                content: msg.content,
                created_at: msg.created_at,
                sender_id: msg.sender_id,
                profiles: { username: msg.username }
            }))
            setMessages(formatted)
        }
    }

    const sendMessage = async () => {
    if (!newMessage.trim()) return

    const { error } = await supabase
        .rpc('send_message', {
            p_conversation_id: id,
            p_content: newMessage.trim()
        })

    if (error) {
        console.error('Error al enviar mensaje:', error)
        return
    }

    // Notificar al chat en tiempo real
    if (channelRef.current) {
        await channelRef.current.send({
            type: 'broadcast',
            event: 'new_message',
            payload: {}
        })
    }

    // Notificar a la lista de conversaciones
    await supabase
        .channel('conversations-list')
        .send({
            type: 'broadcast',
            event: 'new_message',
            payload: {}
        })

    setNewMessage('')
}

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    if (loading) return <p>Cargando...</p>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid gray', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => navigate('/conversations')}>← Volver</button>
                <h2 style={{ margin: 0 }}>{conversation?.name || 'Sin nombre'}</h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'gray' }}>No hay mensajes aún. ¡Escribe algo!</p>
                ) : (
                    messages.map(msg => (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: msg.sender_id === currentUser.id ? 'flex-end' : 'flex-start',
                                backgroundColor: msg.sender_id === currentUser.id ? '#0084ff' : '#3a3a3a',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                maxWidth: '70%'
                            }}
                        >
                            {msg.sender_id !== currentUser.id && (
                                <p style={{ fontSize: '11px', margin: '0 0 4px 0', opacity: 0.7 }}>
                                    {msg.profiles?.username}
                                </p>
                            )}
                            <p style={{ margin: 0 }}>{msg.content}</p>
                        </div>
                    ))
                )}
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid gray', display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    style={{ flex: 1, padding: '8px', borderRadius: '8px' }}
                />
                <button onClick={sendMessage}>Enviar</button>
            </div>
        </div>
    )
}

export default Chat