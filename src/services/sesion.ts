import type { Rol, Sesion } from '../types/auth';

// La sesión es una cookie HttpOnly (HU-25, requisito 13 del Sprint 2): la pone el backend,
// el navegador la envía solo y ningún script de la página puede leerla. Por eso aquí ya no se
// guarda ni se lee ningún token: en `sessionStorage` o `localStorage` no se persiste nada.
// Al recargar, <AuthProvider> pregunta al backend quién es la persona (GET /api/auth/me).
const ROLES: readonly string[] = ['ROLE_USUARIO', 'ROLE_ESPECIALISTA', 'ROLE_ADMIN'];

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && ROLES.includes(valor);
}

export function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== 'object' || valor === null) return false;
  const s = valor as Record<string, unknown>;
  return typeof s.idUsuario === 'number' && typeof s.nombre === 'string' && esRol(s.rol);
}
