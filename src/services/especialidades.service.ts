import type { Especialidad, EspecialidadRequest } from '../types/especialidad';
import { ApiError, request } from './api';

const MENSAJE_LISTA =
  'No pudimos cargar las especialidades porque el servicio respondió de forma inesperada. Inténtalo de nuevo más tarde.';
const MENSAJE_REGISTRO =
  'La especialidad pudo haberse guardado, pero el servicio respondió de forma inesperada. Revisa la lista de especialidades.';
const MENSAJE_NO_ESPECIALISTA =
  'Tu cuenta no está registrada como especialista. Contacta a un administrador.';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}
const texto = (valor: unknown): string | null => (typeof valor === 'string' ? valor : null);
const numero = (valor: unknown): number | null =>
  typeof valor === 'number' && Number.isFinite(valor) ? valor : null;

// Se copian solo los campos que la interfaz muestra. Hoy el backend responde con la entidad
// completa (el especialista incluye datos de su cuenta): nada de eso se conserva en memoria.
export function aEspecialidad(crudo: unknown): Especialidad | null {
  if (!esObjeto(crudo)) return null;
  const idEspecialidad = numero(crudo.idEspecialidad);
  const nombreEspecialidad = texto(crudo.nombreEspecialidad);
  if (idEspecialidad === null || nombreEspecialidad === null) return null;

  const crudoEspecialista = esObjeto(crudo.especialista) ? crudo.especialista : null;
  const idUsuario = crudoEspecialista ? numero(crudoEspecialista.idUsuario) : null;
  const nombre = crudoEspecialista ? texto(crudoEspecialista.nombre) : null;
  const apellido = crudoEspecialista ? texto(crudoEspecialista.apellido) : null;

  return {
    idEspecialidad,
    nombreEspecialidad,
    descripcion: texto(crudo.descripcion) ?? '',
    duracionMinutos: numero(crudo.duracionMinutos) ?? 0,
    especialista:
      idUsuario !== null && nombre !== null ? { idUsuario, nombre, apellido: apellido ?? '' } : null,
  };
}

// HU-08 — GET /api/especialidades (público)
export async function listarEspecialidades(signal?: AbortSignal): Promise<Especialidad[]> {
  const crudo = await request<unknown>('/api/especialidades', { signal });
  if (!Array.isArray(crudo)) throw new ApiError(502, MENSAJE_LISTA);
  return crudo.map(aEspecialidad).filter((e): e is Especialidad => e !== null);
}

// HU-06 — POST /api/especialidades (requiere la sesión de un especialista)
export async function registrarEspecialidad(
  data: EspecialidadRequest,
  token: string,
  signal?: AbortSignal,
): Promise<Especialidad> {
  try {
    const crudo = await request<unknown>('/api/especialidades', { method: 'POST', body: data, token, signal });
    const creada = aEspecialidad(crudo);
    if (!creada) throw new ApiError(502, MENSAJE_REGISTRO);
    return creada;
  } catch (error) {
    // El backend responde 404 cuando el idEspecialista no corresponde a un especialista
    if (error instanceof ApiError && error.status === 404) throw new ApiError(404, MENSAJE_NO_ESPECIALISTA);
    throw error;
  }
}
