# Control de Asistencia · Laboratorio Quito

App web para que 5 trabajadores marquen su asistencia desde el celular (con
ubicación GPS) y el administrador vea los reportes en tiempo real desde un link.

- Trabajadores: eligen su nombre → ingresan PIN → marcan (Entrada, Salida
  almuerzo, Entrada almuerzo, Salida). Se captura la ubicación en cada marcaje.
- Administrador: entra con contraseña y ve estado en vivo, ubicaciones,
  reporte visual y exportación a CSV.

Todo es gratis: Supabase (base de datos + tiempo real) y Netlify/Vercel (hosting).

---

## PASO 1 · Crear la base de datos (Supabase) — 5 min

1. Entra a https://supabase.com y crea una cuenta (con tu correo o Google).
2. Clic en **New project**. Ponle un nombre (ej. `asistencia-lab`), elige una
   contraseña de base de datos (guárdala) y la región más cercana. Crear.
3. Espera ~2 min a que el proyecto se inicialice.
4. En el menú izquierdo abre **SQL Editor** → **New query**.
5. Abre el archivo `supabase_schema.sql` de este proyecto, copia TODO su
   contenido, pégalo y presiona **Run**. Debe decir "Success".
   - Esto crea las tablas, la seguridad, el tiempo real y 5 trabajadores de
     ejemplo con PINs 1111, 2222, 3333, 4444, 5555.
6. Ve a **Settings** (engranaje) → **API**. Copia estos dos valores, los
   necesitas en el paso 3:
   - **Project URL**
   - **anon public** (una clave larga)

Para cambiar nombres o PINs de los trabajadores: menú **Table Editor** →
tabla `trabajadores` → edita las filas directamente.

---

## PASO 2 · Subir el código a GitHub — 5 min

(Si prefieres no usar GitHub, salta al PASO 3 alternativo con Netlify Drop.)

1. Crea una cuenta en https://github.com si no tienes.
2. Crea un repositorio nuevo (botón **New**), ponle `asistencia-lab`, déjalo
   público o privado, y créalo.
3. Sube esta carpeta al repositorio. La forma más simple sin instalar nada:
   en la página del repo vacío, clic en **uploading an existing file** y
   arrastra TODOS los archivos de esta carpeta (menos las carpetas
   `node_modules` y `dist` si aparecen). Commit.

---

## PASO 3 · Publicar y obtener el link (Netlify) — 5 min

1. Entra a https://netlify.com y regístrate (puedes usar tu cuenta de GitHub).
2. **Add new site** → **Import an existing project** → conecta con GitHub y
   elige tu repositorio `asistencia-lab`.
3. Netlify detecta Vite solo. Confirma:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Antes de desplegar, clic en **Add environment variables** (o luego en
   Site settings → Environment variables) y agrega estas TRES:
   ```
   VITE_SUPABASE_URL        = (el Project URL del paso 1)
   VITE_SUPABASE_ANON_KEY   = (la clave anon public del paso 1)
   VITE_ADMIN_PASSWORD      = (la contraseña que TÚ quieras para el admin)
   ```
5. **Deploy**. En ~1 minuto tendrás un link tipo
   `https://asistencia-lab-xxxx.netlify.app`.
6. Ese es el link que compartes a los trabajadores. En Netlify puedes
   cambiar el nombre en **Site settings → Change site name**.

### PASO 3 alternativo · Sin GitHub (Netlify Drop)

1. En tu compu, dentro de esta carpeta corre `npm install` y luego
   `npm run build` (necesitas Node.js instalado). Esto genera la carpeta `dist`.
   - Nota: con este método las variables van en un archivo `.env` ANTES de
     `npm run build` (copia `.env.example` a `.env` y llénalo).
2. Entra a https://app.netlify.com/drop y arrastra la carpeta `dist`.
3. Te da el link al instante.

(Recomiendo el método con GitHub: así, cada vez que cambies algo, se
actualiza solo, y las variables se manejan mejor.)

---

## PASO 4 · Compartir y usar

- **A los trabajadores:** envía el link por WhatsApp. Al abrirlo, eligen su
  nombre, ponen su PIN y marcan. La primera vez el celular pedirá permiso de
  ubicación: deben aceptar. Sugiéreles "Agregar a pantalla de inicio" para
  que quede como un ícono de app.
- **Para ti (admin):** abre el mismo link, botón "Entrar como administrador",
  ingresa tu contraseña. Verás todo en vivo.

---

## Notas importantes

**Tiempo real:** el panel de admin se actualiza solo cuando alguien marca,
sin recargar. Ya está configurado.

**Ubicación:** usa el GPS del navegador. Es referencial: sirve para verificar
que marcan desde el laboratorio, pero un usuario podría negar el permiso o
falsear la ubicación con apps externas. Si el control de sitio es crítico,
combínalo con otra medida (marcaje solo desde el WiFi del laboratorio, por
ejemplo). El marcaje se registra igual aunque no den permiso de ubicación;
en el panel verás cuáles tienen 📍 y cuáles no.

**Protección de datos (LOPDP Ecuador):** registrar la ubicación de los
empleados es un tratamiento de datos personales. Debes informarles el
propósito (control de asistencia) y tener base de licitud —lo más sólido es
dejarlo por escrito en su contrato o en una política interna de asistencia
que firmen. La app ya muestra un aviso al pie de la pantalla de inicio.

**Seguridad del admin:** el acceso de administrador se protege con la
contraseña que pusiste en `VITE_ADMIN_PASSWORD`. Es una protección de nivel
básico adecuada para 5 personas. Si más adelante quieres seguridad fuerte
(login real, que ni con la clave anon se puedan leer datos sin autenticar),
se puede migrar a Supabase Auth con políticas por rol; avísame y lo ajusto.

**Costo:** el plan gratuito de Supabase y Netlify cubre de sobra 5
trabajadores. No pagas nada.

---

## Estructura del proyecto

```
asistencia-lab/
├── supabase_schema.sql        ← SQL para pegar en Supabase (PASO 1)
├── .env.example               ← plantilla de variables
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx                 ← login / selección de perfil
    ├── App.css
    ├── lib/
    │   ├── supabase.js         ← conexión + configuración
    │   └── utils.js            ← ubicación, fechas, formato
    └── components/
        ├── VistaTrabajador.jsx ← marcar asistencia + PIN
        └── VistaAdmin.jsx      ← panel, tiempo real, reporte, CSV
```
