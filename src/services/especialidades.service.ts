import type { Especialidad, EspecialidadRequest, EspecialidadUpdate } from '../types/especialidad';
import { ApiError, request } from './api';
import { MODO_SIMULADO } from './modo';
import { ESPECIALIDADES, PERFILES, demora, leerSesionSimulada } from './simulado/almacen';

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
  if (MODO_SIMULADO) return demora(ESPECIALIDADES, signal);

  const crudo = await request<unknown>('/api/especialidades', { signal });
  if (!Array.isArray(crudo)) throw new ApiError(502, MENSAJE_LISTA);
  return crudo.map(aEspecialidad).filter((e): e is Especialidad => e !== null);
}

// HU-06 — POST /api/especialidades (requiere la sesión de un especialista; viaja en la cookie)
export async function registrarEspecialidad(data: EspecialidadRequest, signal?: AbortSignal): Promise<Especialidad> {
  if (MODO_SIMULADO) {
    const sesion = leerSesionSimulada();
    const perfil = sesion && PERFILES[sesion.idUsuario];
    const nueva: Especialidad = {
      idEspecialidad: Math.max(0, ...ESPECIALIDADES.map((e) => e.idEspecialidad)) + 1,
      nombreEspecialidad: data.nombreEspecialidad,
      descripcion: data.descripcion,
      duracionMinutos: data.duracionMinutos,
      especialista: perfil ? { idUsuario: perfil.idUsuario, nombre: perfil.nombre, apellido: perfil.apellido } : null,
    };
    ESPECIALIDADES.push(nueva);
    return demora({ ...nueva }, signal);
  }
  try {
    const crudo = await request<unknown>('/api/especialidades', { method: 'POST', body: data, signal });
    const creada = aEspecialidad(crudo);
    if (!creada) throw new ApiError(502, MENSAJE_REGISTRO);
    return creada;
  } catch (error) {
    // El backend responde 404 cuando el idEspecialista no corresponde a un especialista
    if (error instanceof ApiError && error.status === 404) throw new ApiError(404, MENSAJE_NO_ESPECIALISTA);
    throw error;
  }
}

const MENSAJE_EDICION =
  'Los cambios pudieron haberse guardado, pero el servicio respondió de forma inesperada. Revisa la lista de especialidades.';

// HU-07 — PUT /api/especialidades/{id} (ROLE_ESPECIALISTA, solo sus propias especialidades).
// 200 con la especialidad; 400 { campo: mensaje }; 403 si no es suya. Las citas ya confirmadas no
// se alteran aunque cambie la duración.
export async function actualizarEspecialidad(
  idEspecialidad: number,
  data: EspecialidadUpdate,
  signal?: AbortSignal,
): Promise<Especialidad> {
  if (MODO_SIMULADO) {
    const sesion = leerSesionSimulada();
    const existente = ESPECIALIDADES.find((e) => e.idEspecialidad === idEspecialidad);
    if (!existente || existente.especialista?.idUsuario !== sesion?.idUsuario) {
      throw await demora(new ApiError(403, 'No tienes permiso para realizar esta acción.'), signal);
    }
    Object.assign(existente, data);
    return demora({ ...existente }, signal);
  }
  const editada = aEspecialidad(await request<unknown>(`/api/especialidades/${idEspecialidad}`, { method: 'PUT', body: data, signal }));
  if (!editada) throw new ApiError(502, MENSAJE_EDICION);
  return editada;
}
