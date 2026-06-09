import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

/* ── Colores base (dark, consistente con el resto de la app) ── */
const t = {
    bg:      '#0f0f10',
    header:  '#111113',
    card:    '#18181b',
    surface: '#1c1c1f',
    border:  '#2e2e33',
    text:    '#f4f4f5',
    muted:   '#71717a',
    dim:     '#52525b',
    blue:    '#3b82f6',
    green:   '#22c55e',
    red:     '#ef4444',
    amber:   '#f59e0b',
    purple:  '#8b5cf6',
}

const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #2e2e33; border-radius: 4px; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
    @keyframes spin { to { transform: rotate(360deg) } }
    .stat-card { transition: border-color .2s, transform .15s; }
    .stat-card:hover { border-color: #3b82f660 !important; transform: translateY(-2px); }
    .bar-segment { transition: width 1s cubic-bezier(.4,0,.2,1); }
    .user-row { transition: background .12s; }
    .user-row:hover { background: #1c1c1f !important; }
`

/* ── Mini bar chart para actividad diaria ── */
function BarChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: t.muted, fontSize: '13px' }}>
                Sin datos de actividad reciente
            </div>
        )
    }
    const max = Math.max(...data.map(d => Number(d.count)), 1)
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px', padding: '0 4px' }}>
            {data.map((d, i) => {
                const pct = (Number(d.count) / max) * 100
                const date = new Date(d.day + 'T12:00:00')
                return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '10px', color: t.muted, fontWeight: 600 }}>{d.count}</span>
                        <div
                            title={`${d.day}: ${d.count} mensajes`}
                            style={{
                                width: '100%', background: `linear-gradient(to top, ${t.blue}, #60a5fa)`,
                                borderRadius: '4px 4px 2px 2px',
                                height: `${Math.max(pct, 4)}%`,
                                opacity: 0.85,
                                cursor: 'default',
                                transition: 'height .6s cubic-bezier(.4,0,.2,1)'
                            }}
                        />
                        <span style={{ fontSize: '10px', color: t.dim }}>{days[date.getDay()]}</span>
                    </div>
                )
            })}
        </div>
    )
}

/* ── Tarjeta de estadística ── */
function StatCard({ icon, label, value, color, sub }) {
    return (
        <div className="stat-card" style={{
            background: t.card, border: `1px solid ${t.border}`,
            borderRadius: '14px', padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: '8px',
            animation: 'fadeIn .3s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: `${color}18`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', flexShrink: 0
                }}>{icon}</div>
                <span style={{ fontSize: '13px', color: t.muted, fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: t.text, lineHeight: 1 }}>{value ?? '—'}</div>
            {sub && <div style={{ fontSize: '12px', color: t.dim }}>{sub}</div>}
        </div>
    )
}

/* ── Componente principal ── */
function AdminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [recentUsers, setRecentUsers] = useState([])
    const [chartData, setChartData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        loadAll()
    }, [])

    const loadAll = async () => {
        setRefreshing(true)
        try {
            // Verificar si es admin
            const { data: isAdminData, error: adminErr } = await supabase.rpc('is_admin')
            if (adminErr || !isAdminData) {
                setError('No tienes permisos de administrador para ver esta página.')
                setLoading(false)
                setRefreshing(false)
                return
            }

            const [statsRes, usersRes, chartRes] = await Promise.all([
                supabase.rpc('get_admin_stats'),
                supabase.rpc('get_recent_users', { p_limit: 8 }),
                supabase.rpc('get_messages_per_day'),
            ])

            if (statsRes.data) setStats(statsRes.data)
            if (usersRes.data) setRecentUsers(usersRes.data)
            if (chartRes.data) setChartData(chartRes.data)
        } catch (e) {
            setError('Error al cargar estadísticas.')
        }
        setLoading(false)
        setRefreshing(false)
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: t.bg, fontFamily: "'DM Sans', sans-serif", color: t.muted, flexDirection: 'column', gap: '14px' }}>
            <style>{css}</style>
            <div style={{ width: '36px', height: '36px', border: `3px solid ${t.border}`, borderTop: `3px solid ${t.blue}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px' }}>Cargando panel de administración…</span>
        </div>
    )

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: t.bg, fontFamily: "'DM Sans', sans-serif", gap: '16px', padding: '24px' }}>
            <style>{css}</style>
            <span style={{ fontSize: '40px' }}>🚫</span>
            <p style={{ color: t.red, fontSize: '15px', textAlign: 'center', maxWidth: '380px', lineHeight: 1.5 }}>{error}</p>
            <button onClick={() => navigate('/home')} style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.surface, color: t.muted, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>← Volver al inicio</button>
        </div>
    )

    const s = stats || {}

    return (
        <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{css}</style>

            {/* ── Header ── */}
            <div style={{ background: t.header, borderBottom: `1px solid ${t.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => navigate('/home')} style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.muted, borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 500 }}>← Inicio</button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: t.text }}>Panel de Administración</h1>
                    <p style={{ margin: 0, fontSize: '12px', color: t.muted }}>Velochat · Vista general del sistema</p>
                </div>
                <button
                    onClick={loadAll}
                    disabled={refreshing}
                    style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.surface, color: refreshing ? t.dim : t.muted, cursor: refreshing ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    {refreshing ? '⟳' : '↻'} Actualizar
                </button>
            </div>

            <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>

                {/* ── Sección: Estadísticas principales ── */}
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '14px' }}>Resumen general</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                    <StatCard icon="👥" label="Usuarios registrados"   value={s.total_users}         color={t.blue}   sub={`${s.new_users_this_week ?? 0} nuevos esta semana`} />
                    <StatCard icon="💬" label="Conversaciones"         value={s.total_conversations}  color={t.green}  sub={`${s.direct_conversations ?? 0} directas · ${s.group_conversations ?? 0} grupos`} />
                    <StatCard icon="📨" label="Mensajes enviados"      value={s.total_messages}       color={t.purple} sub={`${s.messages_today ?? 0} hoy`} />
                    <StatCard icon="🗑️" label="Mensajes eliminados"    value={s.deleted_messages}     color={t.red}    />
                    <StatCard icon="🤝" label="Contactos aceptados"    value={s.total_contacts}       color={t.green}  sub={`${s.pending_requests ?? 0} solicitudes pendientes`} />
                    <StatCard icon="📌" label="Mensajes fijados"       value={s.pinned_messages}      color={t.amber}  />
                    <StatCard icon="🚫" label="Usuarios bloqueados"    value={s.blocked_users}        color={t.red}    />
                </div>

                {/* ── Sección: Actividad ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>

                    {/* Gráfico de actividad */}
                    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', animation: 'fadeIn .4s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>Mensajes por día</p>
                                <p style={{ fontSize: '12px', color: t.muted, marginTop: '2px' }}>Últimos 7 días</p>
                            </div>
                            <span style={{ fontSize: '20px' }}>📊</span>
                        </div>
                        <BarChart data={chartData} />
                    </div>

                    {/* Distribución conversaciones */}
                    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', animation: 'fadeIn .4s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>Distribución de conversaciones</p>
                                <p style={{ fontSize: '12px', color: t.muted, marginTop: '2px' }}>Directas vs Grupales</p>
                            </div>
                            <span style={{ fontSize: '20px' }}>🗂️</span>
                        </div>
                        {(() => {
                            const total = (s.total_conversations || 0)
                            const direct = s.direct_conversations || 0
                            const group = s.group_conversations || 0
                            const pctDirect = total > 0 ? Math.round((direct / total) * 100) : 0
                            const pctGroup = total > 0 ? Math.round((group / total) * 100) : 0
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '13px', color: t.muted }}>Directas</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{direct} · {pctDirect}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: t.surface, borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pctDirect}%`, background: t.blue, borderRadius: '4px', transition: 'width 1s ease' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '13px', color: t.muted }}>Grupales</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{group} · {pctGroup}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: t.surface, borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pctGroup}%`, background: t.purple, borderRadius: '4px', transition: 'width 1s ease' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '8px', padding: '12px', background: t.surface, borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '13px', color: t.muted }}>Solicitudes pendientes</span>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: s.pending_requests > 0 ? t.amber : t.green }}>{s.pending_requests ?? 0}</span>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                </div>

                {/* ── Sección: Usuarios recientes ── */}
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '14px' }}>Usuarios recientes</h2>
                <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', animation: 'fadeIn .5s ease' }}>
                    {recentUsers.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: t.muted, fontSize: '14px' }}>No hay usuarios registrados</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: t.surface }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Usuario</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Nombre</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: t.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Registro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.map((u, i) => (
                                    <tr key={u.id} className="user-row" style={{ borderTop: `1px solid ${t.border}`, background: 'transparent' }}>
                                        <td style={{ padding: '13px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${t.blue}, ${t.purple})`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0
                                                }}>
                                                    {(u.username || '?')[0].toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 500, color: t.text }}>@{u.username || 'sin username'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '13px 16px', color: t.muted }}>{u.full_name || '—'}</td>
                                        <td style={{ padding: '13px 16px', color: t.dim, textAlign: 'right', fontSize: '13px' }}>
                                            {new Date(u.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Footer info ── */}
                <div style={{ marginTop: '24px', padding: '14px 16px', background: t.surface, borderRadius: '12px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>ℹ️</span>
                    <p style={{ fontSize: '13px', color: t.dim, lineHeight: 1.5 }}>
                        Para agregar más administradores, inserta su UUID en la tabla <code style={{ background: t.card, padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: t.text }}>admin_roles</code> desde el SQL Editor de Supabase.
                    </p>
                </div>
            </main>
        </div>
    )
}

export default AdminDashboard