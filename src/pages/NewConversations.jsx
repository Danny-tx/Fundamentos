import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

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

    if (loading) return <p>Cargando...</p>

    return (
        <div>
            <h1>Nueva conversación</h1>
            {message && <p style={{ color: 'red' }}>{message}</p>}

            <div>
                <h2>Selecciona contactos</h2>
                {contacts.length === 0 ? (
                    <p>No tienes contactos, haz panas :D</p>
                ) : (
                    contacts.map(contact => (
                        <div key={contact.id}>
                            <input
                                type="checkbox"
                                checked={selectedUsers.includes(contact.id)}
                                onChange={() => toggleUser(contact.id)}
                            />
                            <span>{contact.username} - {contact.full_name}</span>
                        </div>
                    ))
                )}
            </div>

            {selectedUsers.length > 1 && (
                <div>
                    <label>Nombre del grupo</label>
                    <input
                        type="text"
                        placeholder="Nombre del grupo"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                    />
                </div>
            )}

            <button onClick={createConversation}>Crear conversación</button>
            <button onClick={() => navigate('/conversations')}>Cancelar</button>
        </div>
    )
}

export default NewConversation