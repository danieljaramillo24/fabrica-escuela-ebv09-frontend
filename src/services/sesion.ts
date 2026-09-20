import type { Rol, Sesion } from '../types/auth';

// El token se guarda en sessionStorage (se borra al cerrar la pestaña) y nunca en localStorage,
// según .kiro/steering/security.md. Sigue siendo legible por scripts de la página: la
// protección real contra XSS es no renderizar HTML sin sanear.
const CLAVE_SESION = 'vitalis.sesion';
const ROLES: readonly string[] = ['ROLE_USUARIO', 'ROLE_ESPECIALISTA', 'ROLE_ADMIN'];

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && ROLES.includes(valor);
}

export function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== 'object' || valor === null) return false;
  const s = valor as Record<string, unknown>;
  return (
    typeof s.token === 'string' &&
    s.token.length > 0 &&
    typeof s.idUsuario === 'number' &&
    typeof s.nombre === 'string' &&
    esRol(s.rol)
  );
}

/** true si el token es un JWT con `exp` vencido. Si no es un JWT legible, no se considera vencido. */
export function tokenExpirado(token: string, ahora: number = Date.now()): boolean {
  const partes = token.split('.');
  if (partes.length !== 3) return false;
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload: unknown = JSON.parse(atob(base64));
    if (typeof payload !== 'object' || payload === null) return false;
    const exp = (payload as Record<string, unknown>).exp;
    return typeof exp === 'number' && exp * 1000 <= ahora;
  } catch {
    return false;
  }
}

export function leerSesionGuardada(): Sesion | null {
  try {
    const bruto = sessionStorage.getItem(CLAVE_SESION);
    if (!bruto) return null;
    const dato: unknown = JSON.parse(bruto);
    if (esSesion(dato) && !tokenExpirado(dato.token)) return dato;
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // Almacenamiento no disponible o contenido dañado: se trata como sin sesión
  }
  return null;
}

export function guardarSesion(sesion: Sesion): void {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    // Sin almacenamiento la sesión dura solo mientras no se recargue la página
  }
}

export function borrarSesion(): void {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // nada que borrar
  }
}
