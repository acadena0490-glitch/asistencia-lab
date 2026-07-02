import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Faltan variables de entorno de Supabase. Revisa tu archivo .env')
}

export const supabase = createClient(url, key)

// Contraseña del administrador. Cámbiala por la que quieras.
// (Se compara dentro de la app; el reporte no se muestra sin ella.)
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2025'

export const TIPOS = [
  { key: 'entrada',           label: 'Entrada',              icon: '→' },
  { key: 'salida_almuerzo',   label: 'Salida al almuerzo',   icon: '⏸' },
  { key: 'entrada_almuerzo',  label: 'Entrada del almuerzo', icon: '↩' },
  { key: 'salida',            label: 'Salida',               icon: '←' },
]
export const SEQ = TIPOS.map(t => t.key)
