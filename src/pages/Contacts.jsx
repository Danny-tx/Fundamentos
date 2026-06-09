import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function Contacts() {
    const [contacts, setContacts] = useState([])
    const [searchUsername, setSearchUsername] = useState('')
    const [searchResult, setSearchResult] = useState(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState({ text: '', type: '' })
    const [requests, setRequests] = useState([])
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const navigate = useNavigate()
    const t = tokens

    useEffect(() => { getContacts(); getRequests() }, [])

    const getContacts = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase.from('contacts').select('status, addressee_id')
            .eq('requester_id', user.id).eq('status', 'accepted')
        if (data) {
            const withProfiles = await Promise.all(data.map(async item => {
                const { data: profile } = await supabase.from('profiles')
                    .select('username, full_name, avatar_url').eq('id', item.addressee_id).single()
                return { ...item, profile }
            }))
            setContacts(withProfiles)
        }
        setLoading(false)
    }

    const getRequests = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('contacts').select('status, requester_id')
            .eq('addressee_id', user.id).eq('status', 'pending')
        if (data) {
            const withProfiles = await Promise.all(data.map(async item => {
                const { data: profile } = await supabase.from('profiles')
                    .select('username, full_name, avatar_url').eq('id', item.requester_id).single()
                return { ...item, profile }
            }))
            setRequests(withProfiles)
        }
    }

    const searchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase.from('profiles').select('id, username, full_name, avatar_url')
            .eq('username', searchUsername).neq('id', user.id).single()
        if (data) { setSearchResult(data); setMessage({ text: '', type: '' }) }
        else { setSearchResult(null); setMessage({ text: 'Usuario no encontrado', type: 'error' }) }
    }

    const sendRequest = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: existing } = await supabase.from('contacts').select('status')
            .eq('requester_id', user.id).eq('addressee_id', searchResult.id).single()
        if (existing) { setMessage({ text: 'Ya enviaste una solicitud a este usuario', type: 'error' }); return }
        const { error } = await supabase.from('contacts')
            .insert({ requester_id: user.id, addressee_id: searchResult.id, status: 'pending' })
        if (error) { setMessage({ text: 'Error: ' + error.message, type: 'error' }) }
        else { setMessage({ text: '¡Solicitud enviada!', type: 'success' }); setSearchResult(null); setSearchUsername(''); getContacts() }
    }

    const acceptRequest = async (requesterId) => {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('contacts').update({ status: 'accepted' })
            .eq('requester_id', requesterId).eq('addressee_id', user.id)
        await supabase.from('contacts')
            .insert({ requester_id: user.id, addressee_id: requesterId, status: 'accepted' })
        setMessage({ text: '¡Solicitud aceptada!', type: 'success' })
        getRequests(); getContacts()
    }

    const rejectRequest = async (requesterId) => {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('contacts').delete()
            .eq('requester_id', requesterId).eq('addressee_id', user.id)
        setMessage({ text: 'Solicitud rechazada', type: 'error' })
        getRequests()
    }

    // #17 — Eliminar contacto via RPC
    const doDeleteContact = async () => {
        const { error } = await supabase.rpc('delete_contact', { p_contact_id: deleteConfirm })
        if (!error) { setMessage({ text: 'Contacto eliminado', type: 'error' }); getContacts() }
        setDeleteConfirm(null)
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: t.bg, color: t.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{googleFont}</style>
            Cargando...
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{googleFont + scrollbarCss}</style>

            {/* Modal eliminar contacto */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '28px 24px', width: '320px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: t.text }}>¿Eliminar contacto?</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '14px', color: t.muted, lineHeight: 1.5 }}>Esta acción eliminará el contacto de ambas partes.</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.muted, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Cancelar</button>
                            <button onClick={doDeleteContact} style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600 }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ background: t.header, borderBottom: `1px solid ${t.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => navigate('/home')} style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.muted, borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 500 }}>← Inicio</button>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: t.text }}>Contactos</h1>
            </div>

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Toast de mensaje */}
                {message.text && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, background: message.type === 'success' ? '#14532d' : '#2d0a0a', color: message.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${message.type === 'success' ? '#166534' : '#7f1d1d'}` }}>
                        {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
                    </div>
                )}

                {/* Buscar usuario */}
                <section style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px' }}>
                    <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: t.text }}>Agregar contacto</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text" placeholder="Buscar por username"
                            value={searchUsername} onChange={e => setSearchUsername(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && searchUser()}
                            style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.input, color: t.text, fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = '#3b82f6'}
                            onBlur={e => e.target.style.borderColor = t.border}
                        />
                        <button onClick={searchUser} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600 }}>Buscar</button>
                    </div>
                    {searchResult && (
                        <div style={{ marginTop: '14px', padding: '14px', background: t.surface, borderRadius: '12px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '16px', overflow: 'hidden' }}>
                                    {searchResult.avatar_url
                                        ? <img src={searchResult.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none' }} />
                                        : searchResult.username[0].toUpperCase()
                                    }
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: t.text }}>{searchResult.username}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: t.muted }}>{searchResult.full_name}</p>
                                </div>
                            </div>
                            <button onClick={sendRequest} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600 }}>+ Agregar</button>
                        </div>
                    )}
                </section>

                {/* Solicitudes recibidas */}
                {requests.length > 0 && (
                    <section style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px' }}>
                        <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: t.text }}>
                            Solicitudes pendientes
                            <span style={{ marginLeft: '8px', background: '#3b82f6', color: 'white', borderRadius: '20px', padding: '2px 8px', fontSize: '12px' }}>{requests.length}</span>
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {requests.map(item => (
                                <div key={item.requester_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: t.surface, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '15px', overflow: 'hidden' }}>
                                            {item.profile?.avatar_url
                                                ? <img src={item.profile.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none' }} />
                                                : item.profile?.username?.[0]?.toUpperCase() || '?'
                                            }
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: t.text }}>{item.profile?.username}</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: t.muted }}>{item.profile?.full_name}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => acceptRequest(item.requester_id)} style={{ padding: '7px 14px', borderRadius: '9px', border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600 }}>✓ Aceptar</button>
                                        <button onClick={() => rejectRequest(item.requester_id)} style={{ padding: '7px 14px', borderRadius: '9px', border: `1px solid ${t.border}`, background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 500 }}>✕ Rechazar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Mis contactos */}
                <section style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px' }}>
                    <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: t.text }}>Mis contactos ({contacts.length})</h2>
                    {contacts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: t.muted, fontSize: '14px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                            No tienes contactos aún
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {contacts.map(item => (
                                <div key={item.addressee_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: t.surface, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '15px', overflow: 'hidden' }}>
                                            {item.profile?.avatar_url
                                                ? <img src={item.profile.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none' }} />
                                                : item.profile?.username?.[0]?.toUpperCase() || '?'
                                            }
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: t.text }}>{item.profile?.username}</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: t.muted }}>{item.profile?.full_name || 'Sin nombre'}</p>
                                        </div>
                                    </div>
                                    {/* #17 — Botón eliminar contacto */}
                                    <button onClick={() => setDeleteConfirm(item.addressee_id)} style={{ padding: '7px 12px', borderRadius: '9px', border: `1px solid #7f1d1d`, background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 500 }}>🗑️ Eliminar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

const tokens = {
    bg: '#0f0f10',
    header: '#111113',
    card: '#18181b',
    surface: '#1c1c1f',
    border: '#2e2e33',
    text: '#f4f4f5',
    muted: '#71717a',
    input: '#18181b',
}
const googleFont = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`
const scrollbarCss = `::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2e2e33;border-radius:4px}`

export default Contacts