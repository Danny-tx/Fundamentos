import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [ready, setReady] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event,session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setReady(true)
                setMessage('Puedes escribir tu contraseña')
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    const handleReset = async () => {
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setError(error.message)
        } else {
            setMessage('Constraseña actualizada')
            setTimeout(() => navigate('/'), 2000)
        }
        setLoading(false)
    }

    if (ready) return <p>Verificando enlace...</p>

    return (
        <div>
            <h1>Nueva contraseña</h1>
            {message && <p style={{color: 'green'}}>{message}</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}
            <input type="password" placeholder="Nueva contraseña" value={password} onChange={e => setPassword(e.target.value)} />
            <input type="password" placeholder="Confirmar nueva contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/>
            <button onClick={handleReset} disabled={loading}>
                {loading ? 'Guardando...': 'Guardar contraseña'}
            </button>
        </div>
    )
}

export default ResetPassword