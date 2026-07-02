// Obtiene la ubicación del celular (GPS del navegador)
export function obtenerUbicacion() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        precision_m: Math.round(p.coords.accuracy),
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  })
}

export function hoyEcuador() {
  // Fecha local de Ecuador (UTC-5)
  const f = new Date(Date.now() - 5 * 60 * 60 * 1000)
  return f.toISOString().slice(0, 10)
}

export function fmtHora(iso) {
  return new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

export function fmtFecha(fecha) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-EC', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

export function iniciales(nombre) {
  return nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}
