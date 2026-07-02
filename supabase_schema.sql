-- ============================================================
--  CONTROL DE ASISTENCIA - LABORATORIO QUITO
--  Esquema de base de datos para Supabase (PostgreSQL)
--  Copia y pega TODO esto en: Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1) TABLA DE TRABAJADORES ----------------------------------
create table if not exists trabajadores (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  pin         text not null,           -- PIN de 4 dígitos para marcar
  activo      boolean default true,
  creado_en   timestamptz default now()
);

-- 2) TABLA DE MARCAJES --------------------------------------
create table if not exists marcajes (
  id            uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references trabajadores(id) on delete cascade,
  tipo          text not null check (tipo in ('entrada','salida_almuerzo','entrada_almuerzo','salida')),
  fecha         date not null default (now() at time zone 'America/Guayaquil')::date,
  hora          timestamptz not null default now(),
  lat           double precision,
  lng           double precision,
  precision_m   integer
);

-- Índice para consultas rápidas por trabajador y día
create index if not exists idx_marcajes_trab_fecha on marcajes(trabajador_id, fecha);

-- Evita marcajes duplicados del mismo tipo el mismo día
create unique index if not exists uniq_marcaje_dia
  on marcajes(trabajador_id, tipo, fecha);

-- 3) SEGURIDAD (Row Level Security) -------------------------
alter table trabajadores enable row level security;
alter table marcajes    enable row level security;

-- Los trabajadores marcan con PIN (app pública sin login de Supabase),
-- por eso permitimos lectura de la lista de trabajadores y la inserción
-- de marcajes desde la clave pública (anon). El acceso de ADMIN a los
-- reportes se protege con una contraseña dentro de la app + estas reglas.

-- Cualquiera con el link puede ver la lista de trabajadores activos (para elegir su nombre)
create policy "leer_trabajadores_activos"
  on trabajadores for select
  using (activo = true);

-- Cualquiera con el link puede registrar (insertar) un marcaje
create policy "insertar_marcaje"
  on marcajes for insert
  with check (true);

-- Cualquiera con el link puede leer marcajes (necesario para el panel admin
-- y para que el trabajador vea sus marcajes del día). El panel admin queda
-- protegido por contraseña en la app.
create policy "leer_marcajes"
  on marcajes for select
  using (true);

-- 4) TIEMPO REAL --------------------------------------------
-- Activa realtime para que el admin vea marcajes al instante
alter publication supabase_realtime add table marcajes;

-- 5) DATOS DE EJEMPLO (edita nombres y PINs a tu gusto) -----
insert into trabajadores (nombre, pin) values
  ('Carlos Vega',      '1111'),
  ('Andrea Suárez',    '2222'),
  ('Diego Ponce',      '3333'),
  ('María Jaramillo',  '4444'),
  ('Luis Andrade',     '5555')
on conflict do nothing;

-- LISTO. Ve a Settings > API y copia:
--   Project URL   -> VITE_SUPABASE_URL
--   anon public   -> VITE_SUPABASE_ANON_KEY
