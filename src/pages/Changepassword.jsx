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
        <div style={ui.shell}>
            <div style={ui.header}>
                <button onClick={() => navigate('/profile')} style={ui.ghostBtn}>← Perfil</button>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Cambiar contraseña</h1>
            </div>

            <main style={ui.card}>
                <p style={{ margin: '0 0 14px', color: '#71717a', fontSize: '14px' }}>
                    Actualiza tus credenciales para mantener tu cuenta segura.
                </p>

                {error && <div style={ui.error}>{error}</div>}
                {message && <div style={ui.success}>{message}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                    <div>
                        <label style={ui.label}>Contraseña actual</label>
                        <input
                            type="password"
                            placeholder="Tu contraseña actual"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            style={ui.input}
                        />
                    </div>

                    <div>
                        <label style={ui.label}>Nueva contraseña</label>
                        <input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            style={ui.input}
                        />
                    </div>

                    <div>
                        <label style={ui.label}>Confirmar nueva contraseña</label>
                        <input
                            type="password"
                            placeholder="Repite tu nueva contraseña"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            style={ui.input}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <button
                            onClick={handleChange}
                            disabled={loading}
                            style={ui.primaryBtn}
                        >
                            {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                        </button>

                        <button
                            onClick={() => navigate('/profile')}
                            style={ui.ghostBtn}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
const ui = {
    shell: {
        minHeight: '100vh',
        background: '#0f0f10',
        color: '#f4f4f5',
        fontFamily: "'DM Sans', sans-serif",
    },
    header: {
        background: '#111113',
        borderBottom: '1px solid #1c1c1f',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    card: {
        maxWidth: '520px',
        margin: '24px auto',
        padding: '22px',
        borderRadius: '16px',
        background: '#18181b',
        border: '1px solid #2e2e33',
        boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
    },
    label: { display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' },
    input: {
        width: '100%',
        padding: '11px 12px',
        borderRadius: '10px',
        border: '1px solid #2e2e33',
        background: '#111113',
        color: '#f4f4f5',
        fontSize: '14px',
        fontFamily: 'inherit',
        outline: 'none',
        boxSizing: 'border-box',
    },
    primaryBtn: {
        padding: '10px 16px',
        borderRadius: '10px',
        border: 'none',
        background: '#3b82f6',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: 'inherit',
    },
    ghostBtn: {
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1px solid #2e2e33',
        background: '#1c1c1f',
        color: '#a1a1aa',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'inherit',
    },
    error: {
        marginTop: '10px',
        background: '#2d0a0a',
        border: '1px solid #7f1d1d',
        color: '#f87171',
        borderRadius: '10px',
        padding: '10px 12px',
        fontSize: '14px',
    },
    success: {
        marginTop: '10px',
        background: '#10251a',
        border: '1px solid #14532d',
        color: '#4ade80',
        borderRadius: '10px',
        padding: '10px 12px',
        fontSize: '14px',
    },
}

export default ChangePassword