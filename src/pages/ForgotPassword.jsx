import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleReset = async () => {
        const {error} = await supabase.auth.resetPasswordForEmail(email)
        if (error) {
            setError(error.message)
        } else {
            setMessage('Revisa tu correo para restablecer tu constraseña')
        }
    }

    return (
        <div>
            <h1>Recuperar tu Contraseña</h1>
            {error && <p style={{color: 'red'}}>{error}</p>}
            {message && <p style={{color: 'green'}}>{message}</p>}
            <input type="email" placeholder="Email" onChange={e=>setEmail(e.target.value)} />
            <button onClick={handleReset}>Enviar correo</button>
            <p><Link to={"/"}>Volver al login</Link></p>
        </div>
    )
}

export default ForgotPassword