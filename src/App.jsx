import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { iniciales } from './lib/utils'
import VistaTrabajador from './components/VistaTrabajador'
import VistaAdmin from './components/VistaAdmin'
import './App.css'

export default function App() {
  const [trabajadores, setTrabajadores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState({ tipo: 'login' })

  useEffect(() => {
    supabase.from('trabajadores').select('*').eq('activo', true).order('nombre')
      .then(({ data }) => { setTrabajadores(data || []); setCargando(false) })
  }, [])

  if (vista.tipo === 'trabajador')
    return <Contenedor><VistaTrabajador trabajador={vista.data} onSalir={() => setVista({ tipo: 'login' })} /></Contenedor>

  if (vista.tipo === 'admin')
    return <Contenedor><VistaAdmin trabajadores={trabajadores} onSalir={() => setVista({ tipo: 'login' })} /></Contenedor>

  return (
    <Contenedor>
      <div className="card">
        <div className="logo">🕐</div>
        <h1 className="center" style={{ margin: '4px 0 2px' }}>Control de asistencia</h1>
        <p className="muted center">Laboratorio · Quito</p>

        {cargando ? <p className="muted center">Cargando…</p> : (
          <>
            <p className="muted" style={{ marginBottom: 8 }}>Selecciona tu perfil</p>
            <div className="worker-list">
              {trabajadores.map(t => (
                <button key={t.id} className="worker-btn" onClick={() => setVista({ tipo: 'trabajador', data: t })}>
                  <span className="avatar-sm">{iniciales(t.nombre)}</span> {t.nombre}
                </button>
              ))}
            </div>
            <button className="btn-admin" onClick={() => setVista({ tipo: 'admin' })}>🔒 Entrar como administrador</button>
          </>
        )}
      </div>
      <p className="footer">Al marcar aceptas que se registre tu ubicación con fines de control de asistencia.</p>
    </Contenedor>
  )
}

function Contenedor({ children }) {
  return <div className="app-bg"><div className="app-wrap">{children}</div></div>
}
