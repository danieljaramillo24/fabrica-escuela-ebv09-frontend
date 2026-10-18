import type { LoginRequest, LoginResponse, Sesion } from '../types/auth';
import { ApiError, request } from './api';
import { MODO_SIMULADO } from './modo';
import { esSesion } from './sesion';
import {
  demora,
  guardarSesionSimulada,
  leerSesionSimulada,
  sesionPorCorreo,
} from './simulado/almacen';

// El mensaje NO debe revelar si falló el correo o la contraseña (HU-02, requisito no funcional)
const MENSAJE_CREDENCIALES = 'Las credenciales ingresadas no son válidas.';
// HU-23: tras 5 intentos fallidos seguidos el servidor bloquea la cuenta 15 minutos (423 o 429).
// El aviso no dice si el correo existe: es el mismo para cualquier cuenta bloqueada.
const MENSAJE_BLOQUEO =
  'Por seguridad, el acceso está bloqueado temporalmente tras varios intentos fallidos. Inténtalo de nuevo en 15 minutos.';
const MENSAJE_RESPUESTA =
  'No pudimos iniciar tu sesión porque el servicio respondió de forma inesperada. Inténtalo de nuevo más tarde.';

// HU-02 — POST /api/auth/login
// 200 con { idUsuario, nombre, rol } y la cookie de sesión en `Set-Cookie` (HttpOnly, Secure,
// SameSite); 400 o 401 con credenciales inválidas. El frontend nunca recibe el token.
export async function iniciarSesion(data: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
  if (MODO_SIMULADO) {
    const sesion = sesionPorCorreo(data.correo);
    guardarSesionSimulada(sesion);
    return demora(sesion, signal);
  }

  let respuesta: unknown;
  try {
    respuesta = await request<unknown>('/api/auth/login', { method: 'POST', body: data, signal });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 423 || error.status === 429)) {
      throw new ApiError(error.status, MENSAJE_BLOQUEO);
    }
    const credencialesInvalidas =
      error instanceof ApiError &&
      (error.status === 401 || (error.status === 400 && Object.keys(error.fieldErrors).length === 0));
    if (credencialesInvalidas) throw new ApiError(error.status, MENSAJE_CREDENCIALES);
    throw error;
  }

  if (!esSesion(respuesta)) throw new ApiError(502, MENSAJE_RESPUESTA);
  return { idUsuario: respuesta.idUsuario, nombre: respuesta.nombre, rol: respuesta.rol };
}

// GET /api/auth/me — quién es la persona dueña de la cookie de sesión. Se usa al abrir o
// recargar la aplicación: como la cookie es HttpOnly, el frontend no puede leerla por sí mismo.
// Sin sesión válida (401), sin conexión o con una respuesta inesperada devuelve null.
export async function obtenerSesionActual(signal?: AbortSignal): Promise<Sesion | null> {
  if (MODO_SIMULADO) return demora(leerSesionSimulada(), signal, 100);

  try {
    const respuesta = await request<unknown>('/api/auth/me', { signal });
    return esSesion(respuesta)
      ? { idUsuario: respuesta.idUsuario, nombre: respuesta.nombre, rol: respuesta.rol }
      : null;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return null;
  }
}

// HU-26 — POST /api/auth/logout: el backend invalida la sesión y borra la cookie (204).
// El frontend no puede borrar una cookie HttpOnly. Si la llamada falla, la persona ya salió de la
// interfaz; la cookie caduca por inactividad en el servidor (HU-25).
export async function cerrarSesionEnServidor(): Promise<void> {
  if (MODO_SIMULADO) {
    guardarSesionSimulada(null);
    return;
  }
  try {
    await request<void>('/api/auth/logout', { method: 'POST' });
  } catch {
    // Se ignora a propósito: ver comentario arriba
  }
}
