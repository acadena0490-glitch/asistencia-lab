import { useState, useEffect } from 'react'
import { supabase, TIPOS, SEQ } from '../lib/supabase'
import { obtenerUbicacion, hoyEcuador, fmtHora, fmtFecha, iniciales } from '../lib/utils'

export default function VistaTrabajador({ trabajador, onSalir }) {
  const [marcajes, setMarcajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [autorizado, setAutorizado] = useState(false)
  const [errorPin, setErrorPin] = useState(false)

  const hoy = hoyEcuador()

  async function cargar() {
    const { data } = await supabase
      .from('marcajes')
      .select('*')
      .eq('trabajador_id', trabajador.id)
      .eq('fecha', hoy)
      .order('hora', { ascending: true })
    setMarcajes(data || [])
    setCargando(false)
  }

  useEffect(() => { if (autorizado) cargar() }, [autorizado])

  function verificarPin() {
    if (pinInput === trabajador.pin) {
      setAutorizado(true)
      setErrorPin(false)
    } else {
      setErrorPin(true)
    }
  }

  const hechos = marcajes.map(m => m.tipo)
  const siguiente = SEQ.find(k => !hechos.includes(k))
  const tipoSiguiente = TIPOS.find(t => t.key === siguiente)

  async function marcar() {
    setMensaje({ tipo: 'info', texto: 'Obteniendo tu ubicación…' })
    const geo = await obtenerUbicacion()
    const { error } = await supabase.from('marcajes').insert({
      trabajador_id: trabajador.id,
      tipo: tipoSiguiente.key,
      fecha: hoy,
      hora: new Date().toISOString(),
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      precision_m: geo?.precision_m ?? null,
    })
    if (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudo registrar. Intenta de nuevo.' })
      return
    }
    setMensaje({
      tipo: geo ? 'ok' : 'warn',
      texto: geo
        ? `${tipoSiguiente.label} registrada · ubicación capturada`
        : `${tipoSiguiente.label} registrada · sin permiso de ubicación`,
    })
    cargar()
  }

  // Pantalla de PIN
  if (!autorizado) {
    return (
      <div className="card">
        <button className="link-back" onClick={onSalir}>← Cambiar usuario</button>
        <div className="avatar-lg">{iniciales(trabajador.nombre)}</div>
        <h2 style={{ textAlign: 'center', margin: '8px 0 2px' }}>{trabajador.nombre}</h2>
        <p className="muted center">Ingresa tu PIN para marcar</p>
        <input
          className="pin"
          type="tel"
          inputMode="numeric"
          maxLength={4}
          value={pinInput}
          placeholder="••••"
          onChange={e => { setPinInput(e.target.value.replace(/\D/g, '')); setErrorPin(false) }}
          onKeyDown={e => e.key === 'Enter' && verificarPin()}
        />
        {errorPin && <p className="center" style={{ color: '#c0392b', fontSize: 13 }}>PIN incorrecto</p>}
        <button className="btn-primary" onClick={verificarPin}>Continuar</button>
      </div>
    )
  }

  return (
    <div className="card">
      <button className="link-back" onClick={onSalir}>← Cambiar usuario</button>
      <div className="worker-head">
        <div className="avatar-sm">{iniciales(trabajador.nombre)}</div>
        <div>
          <strong>{trabajador.nombre}</strong>
          <div className="muted" style={{ fontSize: 12, textTransform: 'capitalize' }}>{fmtFecha(hoy)} · Quito</div>
        </div>
      </div>

      {cargando ? <p className="muted center">Cargando…</p> : (
        <>
          {siguiente ? (
            <button className="btn-marcar" onClick={marcar}>
              <span className="big-icon">{tipoSiguiente.icon}</span>
              Marcar {tipoSiguiente.label}
            </button>
          ) : (
            <div className="done-box">✓ Jornada completa<br /><small>Registraste los 4 marcajes de hoy</small></div>
          )}

          {mensaje && <p className={`msg ${mensaje.tipo}`}>{mensaje.texto}</p>}

          <div className="timeline">
            {TIPOS.map(t => {
              const rec = marcajes.find(m => m.tipo === t.key)
              return (
                <div className="tl-row" key={t.key}>
                  <span className={`dot ${rec ? 'on' : ''}`} />
                  <span className={`tl-label ${rec ? '' : 'muted'}`}>{t.label}</span>
                  <span className="tl-time">{rec ? fmtHora(rec.hora) : '—'}</span>
                  {rec && rec.lat && <span className="pin-ok" title={`${rec.lat.toFixed(5)}, ${rec.lng.toFixed(5)}`}>📍</span>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
