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
            .single()

        if (existingUser) {
            setError('Ese username ya está en uso')
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        })

        if (error) {
            setError(error.message)
        } else {
            navigate('/')
        }
    }

    return (
        <div>
            <h1>Registro</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} />
            <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} />
            <button onClick={handleRegister}>Registrarse</button>
            <p><Link to="/">¿Ya tienes cuenta? Inicia sesión</Link></p>
        </div>
    )
}

export default Register