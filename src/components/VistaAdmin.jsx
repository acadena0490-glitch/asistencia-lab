import { useState, useEffect } from 'react'
import { supabase, ADMIN_PASSWORD, TIPOS, SEQ } from '../lib/supabase'
import { hoyEcuador, fmtHora, fmtFecha, iniciales } from '../lib/utils'

export default function VistaAdmin({ trabajadores, onSalir }) {
  const [pass, setPass] = useState('')
  const [ok, setOk] = useState(false)
  const [error, setError] = useState(false)
  const [marcajes, setMarcajes] = useState([])
  const [detalle, setDetalle] = useState(null)

  const hoy = hoyEcuador()

  async function cargar() {
    const { data } = await supabase
      .from('marcajes')
      .select('*')
      .eq('fecha', hoy)
      .order('hora', { ascending: true })
    setMarcajes(data || [])
  }

  useEffect(() => {
    if (!ok) return
    cargar()
    // TIEMPO REAL: escucha nuevos marcajes
    const canal = supabase
      .channel('marcajes-vivo')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'marcajes' }, () => cargar())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [ok])

  if (!ok) {
    return (
      <div className="card">
        <button className="link-back" onClick={onSalir}>← Volver</button>
        <div className="avatar-lg admin">🔒</div>
        <h2 className="center" style={{ margin: '8px 0 2px' }}>Panel de administrador</h2>
        <p className="muted center">Ingresa la contraseña</p>
        <input
          className="pin" type="password" value={pass}
          placeholder="Contraseña"
          onChange={e => { setPass(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && (pass === ADMIN_PASSWORD ? setOk(true) : setError(true))}
        />
        {error && <p className="center" style={{ color: '#c0392b', fontSize: 13 }}>Contraseña incorrecta</p>}
        <button className="btn-primary" onClick={() => pass === ADMIN_PASSWORD ? setOk(true) : setError(true)}>Entrar</button>
      </div>
    )
  }

  const presentes = [...new Set(marcajes.map(m => m.trabajador_id))]
  const completos = trabajadores.filter(t => {
    const hechos = marcajes.filter(m => m.trabajador_id === t.id).map(m => m.tipo)
    return SEQ.every(k => hechos.includes(k))
  })

  function exportarCSV() {
    const filas = [['Trabajador', 'Tipo', 'Fecha', 'Hora', 'Latitud', 'Longitud', 'Precision_m']]
    marcajes.forEach(m => {
      const t = trabajadores.find(x => x.id === m.trabajador_id)
      const tipo = TIPOS.find(x => x.key === m.tipo)?.label || m.tipo
      filas.push([t?.nombre || '', tipo, m.fecha, fmtHora(m.hora), m.lat ?? '', m.lng ?? '', m.precision_m ?? ''])
    })
    const csv = filas.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = `asistencia_${hoy}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card wide">
      <div className="admin-head">
        <div>
          <h2 style={{ margin: 0 }}>Panel de control</h2>
          <div className="muted" style={{ fontSize: 12, textTransform: 'capitalize' }}>{fmtFecha(hoy)}</div>
        </div>
        <div className="live">● en vivo</div>
        <button className="link-back" onClick={onSalir} style={{ margin: 0 }}>Salir</button>
      </div>

      <div className="stats">
        <div className="stat"><b>{presentes.length}/{trabajadores.length}</b><span>Presentes</span></div>
        <div className="stat"><b style={{ color: '#1d9e75' }}>{completos.length}</b><span>Jornada full</span></div>
        <div className="stat"><b>{marcajes.length}</b><span>Marcajes hoy</span></div>
      </div>

      <div className="grid">
        {trabajadores.map(t => {
          const recs = marcajes.filter(m => m.trabajador_id === t.id).sort((a, b) => a.hora.localeCompare(b.hora))
          const completo = completos.some(c => c.id === t.id)
          const presente = presentes.includes(t.id)
          const estado = completo ? { c: '#1d9e75', txt: 'Completa' } : presente ? { c: '#ba7517', txt: 'En curso' } : { c: '#888', txt: 'Sin marcar' }
          const conGeo = recs.filter(r => r.lat)
          return (
            <div className="wcard" key={t.id}>
              <div className="wcard-head">
                <span className="avatar-sm">{iniciales(t.nombre)}</span>
                <strong style={{ flex: 1 }}>{t.nombre}</strong>
                <span style={{ color: estado.c, fontSize: 12 }}>● {estado.txt}</span>
              </div>
              <div className="chips">
                {TIPOS.map(tp => {
                  const rec = recs.find(r => r.tipo === tp.key)
                  return <span key={tp.key} className={`chip ${rec ? 'on' : ''}`}>{tp.label.split(' ')[0]}{rec ? ' ' + fmtHora(rec.hora) : ''}</span>
                })}
              </div>
              {conGeo.length > 0 &&
                <button className="btn-loc" onClick={() => setDetalle(detalle === t.id ? null : t.id)}>
                  📍 Ver ubicaciones ({conGeo.length})
                </button>}
              {detalle === t.id &&
                <div className="loc-list">
                  {conGeo.map(r => (
                    <div className="loc-row" key={r.id}>
                      <span>{TIPOS.find(x => x.key === r.tipo)?.label} · {fmtHora(r.hora)}</span>
                      <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer">
                        {r.lat.toFixed(5)}, {r.lng.toFixed(5)} · ±{r.precision_m}m ↗
                      </a>
                    </div>
                  ))}
                </div>}
            </div>
          )
        })}
      </div>

      <div className="admin-actions">
        <button className="btn-sec" onClick={exportarCSV}>⬇ Exportar CSV</button>
      </div>

      {/* Reporte visual: barras de progreso por trabajador */}
      <div className="report">
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Reporte del día · marcajes completados</h3>
        {trabajadores.map(t => {
          const n = marcajes.filter(m => m.trabajador_id === t.id).length
          const pct = (n / 4) * 100
          return (
            <div className="bar-row" key={t.id}>
              <span className="bar-label">{t.nombre.split(' ')[0]}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: pct + '%' }} /></div>
              <span className="bar-val">{n}/4</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
