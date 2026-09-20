import type { LoginRequest, LoginResponse } from '../types/auth';
import { ApiError, request } from './api';
import { esRol } from './sesion';

// El mensaje NO debe revelar si falló el correo o la contraseña (HU-02, requisito no funcional)
const MENSAJE_CREDENCIALES = 'Las credenciales ingresadas no son válidas.';
const MENSAJE_RESPUESTA =
  'No pudimos iniciar tu sesión porque el servicio respondió de forma inesperada. Inténtalo de nuevo más tarde.';

function esLoginResponse(valor: unknown): valor is LoginResponse {
  if (typeof valor !== 'object' || valor === null) return false;
  const r = valor as Record<string, unknown>;
  return (
    typeof r.token === 'string' &&
    r.token.length > 0 &&
    typeof r.idUsuario === 'number' &&
    typeof r.nombre === 'string' &&
    esRol(r.rol)
  );
}

// HU-02 — POST /api/auth/login (200 con LoginResponse; 400 o 401 con credenciales inválidas)
export async function iniciarSesion(data: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
  let respuesta: unknown;
  try {
    respuesta = await request<unknown>('/api/auth/login', { method: 'POST', body: data, signal });
  } catch (error) {
    const credencialesInvalidas =
      error instanceof ApiError &&
      (error.status === 401 || (error.status === 400 && Object.keys(error.fieldErrors).length === 0));
    if (credencialesInvalidas) throw new ApiError(error.status, MENSAJE_CREDENCIALES);
    throw error;
  }

  if (!esLoginResponse(respuesta)) throw new ApiError(502, MENSAJE_RESPUESTA);
  return respuesta;
}
