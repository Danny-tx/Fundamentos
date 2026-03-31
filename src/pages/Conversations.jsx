import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Conversations() {
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        getConversations()
    }, [])

    const getConversations = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('conversation_participants')
            .select(`
                conversation_id,
                conversations (
                    id,
                    name,
                    type,
                    updated_at
                )
            `)
            .eq('user_id', user.id)

        if (data) {
            setConversations(data)
        }
        setLoading(false)
    }

    if (loading) return <p>Cargando...</p>

    return (
        <div>
            <h1>Conversaciones</h1>
            {conversations.length === 0 ? (
                <p>Aún no hay conversaciones</p>
            ) : (
                conversations.map((item) => (
                    <div key={item.conversation_id}>
                        <p>{item.conversations.name || 'Sin nombre'}</p>
                        <p>{item.conversations.type}</p>
                    </div>
                ))
            )}
            <button onClick={() => navigate('/home')}>Regresar a Home</button>
        </div>
    )
}

export default Conversations