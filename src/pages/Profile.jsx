import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Profile(){
    const [Profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [username, setUsername] = useState('')
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')
    const [message, setMessage] = useState('')
    const navigate = useNavigate()
    const [editing, setEditing] = useState(false)

    useEffect(()=>{
        getProfile()
    }, [])

    const getProfile = async () => {
        const {data: {user}, error:useError} = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        const {data, error} =await supabase
        .from('profiles')
        .select('*')
        .eq('id',user.id)
        .single()

        if (data) {
            setProfile(data)
            setUsername(data.username || '')
            setFullName(data.full_name || '')
            setBio(data.bio || '')
        }
        setLoading(false)
    }
    const updateProfile = async () => {
        const {data: {user}} =await supabase.auth.getUser()
        const {error} = await supabase
        .from('profiles')
        .update({
            username,
            full_name:fullName,
            bio: bio,
        })
        .eq('id',user.id)
        if (error) {
            setMessage('Error al actualizar perfil')
        } else {
            setMessage('Perfil actualizado correctamente')
        }
    }
    
    if (loading) return <p>Cargando...</p>

    return(
        <div>
            <h1>Mi perfil</h1>
            {message && <p style={{color: 'green'}}>{message}</p>}
            <div>
                <label>Username </label>
                <input type="text" value={username} onChange={e=>setUsername(e.target.value)} disabled={!editing}/>
            </div>
            <div>
                <label>Nombre completo </label>
                <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} disabled={!editing}/>
            </div>
            <div>
                <label>Biografia </label>
                <input type="text" value={bio} onChange={e=>setBio(e.target.value)} disabled={!editing}/>
            </div>
            {editing ? (
                <>
                <button onClick={updateProfile}>Guardar cambios</button>
                <button onClick={()=>setEditing(false)}>Cancelar cambios</button>
                </>
            ) :(
                <button onClick={()=>setEditing(true)}>Editar perfil</button>
            ) }
            <button onClick={()=>navigate('/home')}>Regresar a Home</button>
        </div>
    )
}

export default Profile