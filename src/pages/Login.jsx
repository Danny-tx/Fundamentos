import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]= useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        const {error} = await supabase.auth.signInWithPassword({email,password})
        if (error) {
            setError(error.message)
        } else {
            navigate('/home')
        }
    }

    return(
        <div>
            <h1>Mi primer login :D</h1>
            {error && <p style={{color: 'red' }} >{ error}</p>}
            <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Entrar</button>
            <p><Link to="/register">¿No tienes cuenta? Registrate</Link></p>
            <p><Link to="/ForgotPassword">¿Olvidaste tu constraseña?</Link></p>
        </div>
    )
}

export default Login