import type { Rol } from '../types/auth';

// Rutas de la aplicación en un solo lugar: las pantallas no escriben rutas a mano
export const RUTAS = {
  inicio: '/',
  registro: '/registro',
  login: '/login',
  especialidades: '/especialidades',
  registrarEspecialidad: '/registrar-especialidad',
  horarios: '/horarios',
  solicitarCita: '/solicitar-cita',
} as const;

// Pantalla a la que se lleva a cada rol después de iniciar sesión
export function rutaInicioPorRol(rol: Rol): string {
  return rol === 'ROLE_ESPECIALISTA' ? RUTAS.registrarEspecialidad : RUTAS.especialidades;
}

// Solo se acepta volver a rutas internas: evita redirecciones abiertas hacia otros sitios
export function rutaInternaSegura(ruta: unknown): string | null {
  return typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//') ? ruta : null;
}
