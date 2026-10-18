import type { EspecialistaRequest, Perfil, PerfilRequest, RegistroRequest, UsuarioResponse } from '../types/usuario';
import { ApiError, request } from './api';
import { MODO_SIMULADO } from './modo';
import {
  PERFILES,
  correosRegistrados,
  demora,
  leerSesionSimulada,
  nuevoIdUsuario,
} from './simulado/almacen';

const MENSAJE_PERFIL =
  'No pudimos cargar los datos porque el servicio respondió de forma inesperada. Inténtalo de nuevo más tarde.';
const MENSAJE_ESPECIALISTA =
  'El especialista pudo haberse registrado, pero el servicio respondió de forma inesperada. Revisa antes de intentarlo otra vez.';
const MENSAJE_CORREO_DUPLICADO = 'Ya existe una cuenta registrada con ese correo';

// Se copian solo los campos que la interfaz muestra (el backend nunca debe enviar el hash)
export function aPerfil(crudo: unknown): Perfil | null {
  if (typeof crudo !== 'object' || crudo === null) return null;
  const c = crudo as Record<string, unknown>;
  if (
    typeof c.idUsuario !== 'number' ||
    typeof c.nombre !== 'string' ||
    typeof c.apellido !== 'string' ||
    typeof c.correo !== 'string'
  ) {
    return null;
  }
  return {
    idUsuario: c.idUsuario,
    nombre: c.nombre,
    apellido: c.apellido,
    correo: c.correo,
    telefono: typeof c.telefono === 'string' && c.telefono ? c.telefono : null,
  };
}

// HU-01 — Registro de usuario: POST /api/usuarios (201 con UsuarioResponse, 400 con errores)
export async function registrarUsuario(data: RegistroRequest, signal?: AbortSignal): Promise<UsuarioResponse> {
  if (MODO_SIMULADO) {
    if (correosRegistrados().has(data.correo.toLowerCase())) {
      throw await demora(new ApiError(400, MENSAJE_CORREO_DUPLICADO), signal);
    }
    correosRegistrados().add(data.correo.toLowerCase());
    const idUsuario = nuevoIdUsuario();
    PERFILES[idUsuario] = { idUsuario, nombre: data.nombre, apellido: data.apellido, correo: data.correo, telefono: data.telefono ?? null };
    return demora({ ...PERFILES[idUsuario] }, signal);
  }
  return request<UsuarioResponse>('/api/usuarios', { method: 'POST', body: data, signal });
}

// HU-03 — GET /api/usuarios/{id}: solo la propia persona puede consultar sus datos (403 si no)
export async function obtenerPerfil(idUsuario: number, signal?: AbortSignal): Promise<Perfil> {
  if (MODO_SIMULADO) {
    const perfil = PERFILES[idUsuario];
    if (!perfil) throw await demora(new ApiError(404, 'No encontramos lo que buscabas.'), signal);
    return demora({ ...perfil }, signal);
  }
  const perfil = aPerfil(await request<unknown>(`/api/usuarios/${idUsuario}`, { signal }));
  if (!perfil) throw new ApiError(502, MENSAJE_PERFIL);
  return perfil;
}

// HU-03 — PUT /api/usuarios/{id}: 200 con los datos guardados; 400 con { campo: mensaje } o un
// texto (por ejemplo, correo ya usado); 403 si el id no es el de la sesión.
export async function actualizarPerfil(idUsuario: number, data: PerfilRequest, signal?: AbortSignal): Promise<Perfil> {
  if (MODO_SIMULADO) {
    const actual = PERFILES[idUsuario];
    const correo = data.correo.toLowerCase();
    if (correo !== actual.correo.toLowerCase() && correosRegistrados().has(correo)) {
      throw await demora(new ApiError(400, MENSAJE_CORREO_DUPLICADO), signal);
    }
    correosRegistrados().delete(actual.correo.toLowerCase());
    correosRegistrados().add(correo);
    PERFILES[idUsuario] = { idUsuario, nombre: data.nombre, apellido: data.apellido, correo: data.correo, telefono: data.telefono ?? null };
    return demora({ ...PERFILES[idUsuario] }, signal);
  }
  const perfil = aPerfil(await request<unknown>(`/api/usuarios/${idUsuario}`, { method: 'PUT', body: data, signal }));
  if (!perfil) throw new ApiError(502, MENSAJE_PERFIL);
  return perfil;
}

// HU-04 — POST /api/especialistas (solo ROLE_ADMIN): crea la cuenta con ROLE_ESPECIALISTA.
// 201 con los datos; 400 con { campo: mensaje }; 409 (o 400 con texto) si el correo ya existe.
export async function registrarEspecialista(data: EspecialistaRequest, signal?: AbortSignal): Promise<Perfil> {
  if (MODO_SIMULADO) {
    const sesion = leerSesionSimulada();
    if (sesion?.rol !== 'ROLE_ADMIN') throw await demora(new ApiError(403, 'No tienes permiso para realizar esta acción.'), signal);
    if (correosRegistrados().has(data.correo.toLowerCase())) {
      throw await demora(new ApiError(409, MENSAJE_CORREO_DUPLICADO), signal);
    }
    correosRegistrados().add(data.correo.toLowerCase());
    const idUsuario = nuevoIdUsuario();
    PERFILES[idUsuario] = { idUsuario, nombre: data.nombre, apellido: data.apellido, correo: data.correo, telefono: data.telefono ?? null };
    return demora({ ...PERFILES[idUsuario] }, signal);
  }
  const perfil = aPerfil(await request<unknown>('/api/especialistas', { method: 'POST', body: data, signal }));
  if (!perfil) throw new ApiError(502, MENSAJE_ESPECIALISTA);
  return perfil;
}
