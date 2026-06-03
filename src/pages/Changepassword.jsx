import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = async () => {
        setError('')
        setMessage('')

        if (newPassword.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas nuevas no coinciden')
            return
        }

        setLoading(true)

        // 1. Verificar la contraseña actual re-autenticando al usuario
        const { data: { user } } = await supabase.auth.getUser()
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        })

        if (signInError) {
            setError('La contraseña actual es incorrecta')
            setLoading(false)
            return
        }

        // 2. Actualizar a la nueva contraseña
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (updateError) {
            setError('Error al actualizar: ' + updateError.message)
        } else {
            setMessage('¡Contraseña actualizada correctamente!')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => navigate('/profile'), 2000)
        }

        setLoading(false)
    }

    return (
        <div style={{ maxWidth: '400px', margin: '40px auto', padding: '24px' }}>
            <h1>Cambiar contraseña</h1>

            {error && <p style={{ color: '#ff4040', background: '#2a1a1a', padding: '10px', borderRadius: '8px' }}>{error}</p>}
            {message && <p style={{ color: '#4caf50', background: '#1a2a1a', padding: '10px', borderRadius: '8px' }}>{message}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#aaa' }}>Contraseña actual</label>
                    <input
                        type="password"
                        placeholder="Tu contraseña actual"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: 'white', boxSizing: 'border-box' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#aaa' }}>Nueva contraseña</label>
                    <input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: 'white', boxSizing: 'border-box' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#aaa' }}>Confirmar nueva contraseña</label>
                    <input
                        type="password"
                        placeholder="Repite tu nueva contraseña"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: 'white', boxSizing: 'border-box' }}
                    />
                </div>

                <button
                    onClick={handleChange}
                    disabled={loading}
                    style={{ padding: '10px', borderRadius: '8px', background: '#646cff', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '8px' }}
                >
                    {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                </button>

                <button
                    onClick={() => navigate('/profile')}
                    style={{ padding: '10px', borderRadius: '8px', background: 'none', color: '#aaa', border: '1px solid #444', cursor: 'pointer' }}
                >
                    Cancelar
                </button>
            </div>
        </div>
    )
}

export default ChangePassword