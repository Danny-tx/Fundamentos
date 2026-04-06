import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Conversations() {
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const channelRef = useRef(null)

    useEffect(() => {
        let channel

        const run = async() => {
            await getConversations()
            setLoading(false)

            channel = supabase
            .channel('conversations-list', {
                config: {
                    broadcast: {self: true}
                }
            })
            .on('broadcast', {event: 'new_message'}, async() => {
                await getConversations()
            })
            .subscribe((status) => {
            })
            channelRef.current = channel
        }
        run()
        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [])

    const getConversations = async () => {
        const { data, error } = await supabase
            .rpc('get_conversations')

        if (data) {
            setConversations(data)
        }
    }

    if (loading) return <p>Cargando...</p>

    return (
        <div>
            <h1>Conversaciones</h1>
            {conversations.length === 0 ? (
                <p>Aún no hay conversaciones</p>
            ) : (
                conversations.map((item) => (
                    <div key={item.conversation_id} onClick={() => navigate(`/chat/${item.conversation_id}`)} style={{cursor: 'pointer', borderBottom: '1px solid gray', padding: '2px'}}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{item.name || 'Sin nombre'}</p>
                        <p style={{margin: 0, fontSize: '13px', color: 'gray'}}>{item.last_message || 'Sin mensajes'}</p>
                    </div>
                ))
            )}
            <button onClick={() => navigate('/new-conversations')}>Nueva conversacion</button>
            <p></p>
            <button onClick={() => navigate('/home')}>Regresar a Home</button>
        </div>
    )
}

export default Conversations