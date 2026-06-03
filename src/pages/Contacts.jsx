import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Contacts() {
    const [contacts, setContacts] = useState([])
    const [searchUsername, setSearchUsername] = useState('')
    const [searchResult, setSearchResult] = useState(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [requests, setRequests] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        getContacts()
        getRequests()
    }, [])

const getContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('contacts')
        .select('status, addressee_id')
        .eq('requester_id', user.id)
        .eq('status', 'accepted')

    if (data) {
        const contactsWithProfile = await Promise.all(
            data.map(async (item) => {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, full_name')
                    .eq('id', item.addressee_id)
                    .single()
                return { ...item, profile}
            })
        )
        setContacts(contactsWithProfile)
    }
    setLoading(false)
}

const searchUser = async () => {
    const { data: {user} } = await supabase.auth.getUser()

    const { data } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .eq('username', searchUsername)
    .neq('id', user.id)
    .single()
    if (data) {
        setSearchResult(data)
        setMessage('')
    } else {
        setSearchResult(null)
        setMessage('Usuario no encontrado')
    }
}
const sendRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: existing } = await supabase
        .from('contacts')
        .select('status')
        .eq('requester_id', user.id)
        .eq('addressee_id', searchResult.id)
        .single()

    if (existing) {
        setMessage('Ya enviaste una solicitud a este usuario')
        return
    }

    const { error } = await supabase
        .from('contacts')
        .insert({
            requester_id: user.id,
            addressee_id: searchResult.id,
            status: 'pending'
        })

    if (error) {
        console.log('Error exacto:', error)
        setMessage('Error: ' + error.message)
    } else {
        setMessage('Solicitud enviada!')
        setSearchResult(null)
        setSearchUsername('')
        getContacts()
    }
}
const getRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
        .from('contacts')
        .select('status, requester_id')
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

    if (data) {
        //buscara el perfil de cada usuario que envio la solicitud
        const requestsWithProfiles = await Promise.all(
            data.map(async (item) => {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, full_name')
                    .eq('id', item.requester_id)
                    .single()
                return { ...item, profile}
            })
        )
        setRequests(requestsWithProfiles)
    }
}

const acceptRequest = async (requesterId) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
        .from('contacts')
        .update({status: 'accepted'})
        .eq('requester_id', requesterId)
        .eq('addressee_id', user.id)

    if (error) {
        setMessage('Error al aceptar solicitud')
        return
    }

    const { error: inverseError } = await supabase
        .from('contacts')
        .insert({
            requester_id: user.id,
            addressee_id: requesterId,
            status: 'accepted'
        })

    if (!inverseError) {
        setMessage('Solicitud aceptada!')
        getRequests()
        getContacts()
    }
}
// Se crea el contacto inverso (Antes solo aparecia amigos en un solo perfil, no en ambos)

const rejectRequest = async (requesterId) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('requester_id', requesterId)
        .eq('addressee_id', user.id)

    console.log('reject error:', error)

    if (error) {
        setMessage('Error: ' + error.message)
    } else {
        setMessage('Solicitud rechazada')
        getRequests()
    }
}

if (loading) return <p>Cargando...</p>

return (
        <div>
            <h1>Contactos</h1>
            <div>
                <h2>Buscar usuario</h2>
                <input type="text" placeholder="Buscar por username" value={searchUsername} onChange={e => setSearchUsername(e.target.value)}/>
                <button onClick={searchUser}>Buscar</button>
                {message && <p>{message}</p>}
                {searchResult && (
                    <div>
                        <p>{searchResult.username}</p>
                        <p>{searchResult.full_name}</p>
                        <button onClick={sendRequest}>Agregar contacto</button>
                    </div>
                )}
            </div>
            <div>
                <h2>Solicitudes recibidas</h2>
                {requests.length === 0 ? (
                <p>No tienes solicitudes pendientes</p> 
                ) : (
                    requests.map((item) => (
                        <div key={item.requester_id}>
                            <p>{item.profile?.username}</p>
                            <p>{item.profile?.full_name}</p>
                            <button onClick={() => acceptRequest(item.requester_id)}>Aceptar</button>
                            <button onClick={() => rejectRequest(item.requester_id)}>Rechazar</button>
                        </div>
                    ))
                )}
            </div>
            <div>
                <h2>Mis contactos</h2>
                {contacts.length === 0 ? (
                    <p>No tienes contactos aún</p>
                ) : (
                    contacts.map((item) => (
                        <div key={item.addressee_id}>
                            <p>{item.profile?.username} - {item.profile?.full_name}</p>
                        </div>
                    ))
                )}
            </div>
            <button onClick={() => navigate('/home')}>Regresar a Home</button>
        </div>
    )
}


export default Contacts