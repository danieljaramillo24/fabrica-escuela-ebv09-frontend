# Vitalis — Frontend

Interfaz web de la plataforma de reservas de citas médicas (Fábrica-Escuela UdeA 2026-2, equipo EBV09). React 19 + TypeScript, Vite, Tailwind CSS y React Router 6.

## Requisitos

Node.js 20.19 o superior y npm.

## Puesta en marcha

```bash
npm ci          # instala exactamente lo que fija package-lock.json
npm run dev     # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. Reenvía `/api` al backend (`http://localhost:8080` por defecto) |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run lint` | ESLint: TypeScript, reglas de hooks de React y accesibilidad (jsx-a11y) |
| `npm test` | Ejecuta las pruebas automatizadas (Vitest) |
| `npm run test:coverage` | Pruebas con informe de cobertura; falla si baja del 40 % (mínimo de CodeFactory 7.2) |
| `npm run build` | Genera `dist/` para producción |
| `npm run preview` | Sirve `dist/` para revisarlo |

## Variables de entorno

Copia `.env.example` a `.env` (no se versiona). Todo lo que empieza con `VITE_` queda visible en el navegador: nunca pongas secretos.

| Variable | Uso |
|---|---|
| `VITE_API_BASE_URL` | URL del backend en despliegue, sin barra final. En desarrollo déjala vacía |
| `VITE_PROXY_TARGET` | Solo desarrollo: a dónde reenvía Vite `/api` |
| `VITE_MODO_SIMULADO` | Solo desarrollo: `true` usa datos simulados en memoria, para ver las pantallas sin backend |

### Ver las pantallas sin backend

Con `VITE_MODO_SIMULADO=true` en `.env`, cualquier contraseña sirve y el rol sale del correo:

| Correo | Rol |
|---|---|
| `ana@correo.com` (o cualquiera) | Usuario, con una cita de ejemplo |
| `especialista@vitalis.com` | Especialista, con tres horarios |
| `admin@vitalis.com` | Administrador |

Recargar la página (F5) reinicia los datos simulados. En producción esta opción se ignora y su código no se incluye en el build.

## Estructura

```
src/
├── pages/        Una carpeta por historia de usuario (HU01…HU15); pantallas sin HU en comunes/
├── components/   Piezas reutilizables (Layout, FormField, ProtectedRoute, DialogoConfirmacion…)
├── routes/       Mapa de rutas (paths.ts) y redirección de "/"
├── services/     Llamadas a la API; simulado/ solo para desarrollo
├── context/      AuthContext (quién es la persona; la sesión es una cookie HttpOnly)
├── hooks/        useAuth, useCargaDatos, useInactividad, useTitulo
├── types/        Interfaces TypeScript
└── utils/        Validaciones, fechas y helpers compartidos
```

Cada pantalla con formulario tiene su `validacion.ts`; las reglas que usan varias HU están en `utils/`.

## Pantallas

| Ruta | HU | Roles |
|---|---|---|
| `/registro`, `/login` | HU-01, HU-02 | públicas |
| `/especialidades` | HU-08 | públicas |
| `/registrar-especialidad` | HU-06 | especialista |
| `/editar-especialidad` | HU-07 | especialista |
| `/horarios` | HU-09 | especialista |
| `/gestion-agenda` | HU-11 | especialista |
| `/solicitar-cita` | HU-12 | usuario |
| `/disponibilidad` | HU-10 | usuario |
| `/mis-citas` | HU-13 (y HU-14 al cancelar) | usuario |
| `/reprogramar-cita?id=` | HU-15 | usuario |
| `/perfil` | HU-03 | cualquier rol con sesión |
| `/registrar-especialista` | HU-04 | administrador |

Las rutas protegidas son una ayuda de experiencia: el servidor vuelve a comprobar el rol en cada petición.

## Sesión y seguridad

La sesión es una cookie `HttpOnly` que pone el backend: el frontend nunca ve el token y no guarda nada de la sesión en `sessionStorage` ni `localStorage`. Todas las peticiones usan `credentials: 'include'`, y las que cambian datos envían `X-Requested-With`. La sesión se cierra tras 30 minutos de inactividad.

## Pruebas

- **Automatizadas** (`npm test`, Vitest + React Testing Library + jsdom): validaciones, utilidades, lectura de las respuestas del backend, cliente HTTP, sesión, componentes, hooks y las pantallas con sus servicios simulados con `vi.mock`. Los archivos `*.test.ts(x)` viven junto al código que prueban. Cobertura actual: alrededor del 70 % (`npm run test:coverage`).
- **Manuales:** guía [`docs/pruebas-manuales-sprint-2.md`](docs/pruebas-manuales-sprint-2.md). Marca cada casilla y adjunta una captura por HU como evidencia.
- Antes de abrir un PR: `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.

## Despliegue (Render)

Frontend y backend se despliegan en Render, como servicios separados: el backend (Spring Boot) lo despliega el equipo de backend; el frontend es un **sitio estático**.

- `render.yaml` describe el sitio: instala con `npm ci`, construye con `npm run build` y publica `dist/`. Los estilos se generan en el build, no dependen de `node_modules` en el repositorio.
- Crear el servicio: en Render, **New → Blueprint** y elegir este repositorio (o **New → Static Site** con esos mismos comandos y directorio `dist`).
- Define `VITE_API_BASE_URL` con la URL pública del backend en Render, sin barra final. No definas `VITE_MODO_SIMULADO`.
- La regla de reescritura de `render.yaml` envía todas las rutas a `index.html`: sin ella, recargar `/mis-citas` daría 404.
- Acordar con el equipo de backend: que su `FRONTEND_URL` sea la URL de este sitio (CORS con credenciales) y que la cookie de sesión sea `SameSite=None; Secure` (ver `docs/` del proyecto, `security.md`).
- No borres ni ignores `package-lock.json`.

## Convenciones

- Ramas: `feature/<id-hu>-<descripcion>`; commits con Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`).
- Estilos con Tailwind, sin CSS en línea. Accesibilidad objetivo: WCAG 2.2 AA (labels asociados, foco visible, errores con `role="alert"`).
- Validar en el cliente es solo experiencia de uso: la validación del servidor es la que manda.
