import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    
    const handleRegister = async () => {
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle() 

    if (existingUser) {
        setError('Ese username ya está en uso')
        return
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username }
        }
    })

    if (error) {
        setError(error.message)
        return
    }

    // ✅ Actualizar el username en la tabla profiles
    // El trigger ya creó el registro, solo hay que actualizarlo
    if (data.user) {
    // Pequeña espera para que el trigger cree el perfil primero
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: username })
        .eq('id', data.user.id)

    if (profileError) {
        setError('Error al guardar username: ' + profileError.message)
        return
    }
}

    navigate('/')
}

    return (
        <div>
            <h1>Registro</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input type="text" placeholder="Ingresa tu nickname" onChange={e => setUsername(e.target.value)} />
            <input type="email" placeholder="Correo electronico" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} />
            <button onClick={handleRegister}>Crear usuario</button>
            <p><Link to="/">¿Ya tienes cuenta? Inicia sesión en velochat</Link></p>
        </div>
    )
}

export default Register