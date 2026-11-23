import type { Especialista, EspecialistaUpdate } from '../types/especialista';
import { ApiError, request } from './api';
import { MODO_SIMULADO } from './modo';
import {
  ESPECIALIDADES,
  ESPECIALISTAS_IDS,
  PERFILES,
  REGISTROS_MEDICOS,
  correosRegistrados,
  demora,
  leerSesionSimulada,
} from './simulado/almacen';

const MENSAJE_LISTA =
  'No pudimos cargar los especialistas porque el servicio respondió de forma inesperada. Inténtalo de nuevo más tarde.';
const MENSAJE_EDICION =
  'Los cambios pudieron haberse guardado, pero el servicio respondió de forma inesperada. Revisa la lista de especialistas.';
const MENSAJE_CORREO_DUPLICADO = 'Ya existe una cuenta registrada con ese correo';
const MENSAJE_SIN_PERMISO = 'No tienes permiso para realizar esta acción.';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}
const texto = (valor: unknown): string | null => (typeof valor === 'string' && valor ? valor : null);
const numero = (valor: unknown): number | null =>
  typeof valor === 'number' && Number.isFinite(valor) ? valor : null;

// Se copian solo los campos que la interfaz muestra (el backend nunca debe enviar el hash de la
// contraseña). Las especialidades llegan como objetos { idEspecialidad, nombreEspecialidad }.
export function aEspecialista(crudo: unknown): Especialista | null {
  if (!esObjeto(crudo)) return null;
  const idUsuario = numero(crudo.idUsuario);
  const nombre = texto(crudo.nombre);
  const correo = texto(crudo.correo);
  if (idUsuario === null || nombre === null || correo === null) return null;

  const especialidades = Array.isArray(crudo.especialidades)
    ? crudo.especialidades.flatMap((e) => {
        if (!esObjeto(e)) return [];
        const idEspecialidad = numero(e.idEspecialidad);
        const nombreEspecialidad = texto(e.nombreEspecialidad);
        return idEspecialidad !== null && nombreEspecialidad !== null ? [{ idEspecialidad, nombreEspecialidad }] : [];
      })
    : [];

  return {
    idUsuario,
    nombre,
    apellido: texto(crudo.apellido) ?? '',
    correo,
    telefono: texto(crudo.telefono),
    registroMedico: texto(crudo.registroMedico),
    especialidades,
  };
}

function especialistaSimulado(idUsuario: number): Especialista | null {
  const perfil = PERFILES[idUsuario];
  if (!perfil || !ESPECIALISTAS_IDS.has(idUsuario)) return null;
  return {
    ...perfil,
    registroMedico: REGISTROS_MEDICOS[idUsuario] ?? null,
    especialidades: ESPECIALIDADES.filter((e) => e.especialista?.idUsuario === idUsuario).map((e) => ({
      idEspecialidad: e.idEspecialidad,
      nombreEspecialidad: e.nombreEspecialidad,
    })),
  };
}

// HU-20 y HU-21 — GET /api/especialistas: especialistas activos con sus especialidades. Lo usan
// los pacientes (HU-20) y el administrador (HU-21).
export async function listarEspecialistas(signal?: AbortSignal): Promise<Especialista[]> {
  if (MODO_SIMULADO) {
    const lista = [...ESPECIALISTAS_IDS].map(especialistaSimulado).filter((e): e is Especialista => e !== null);
    return demora(lista, signal);
  }
  const crudo = await request<unknown>('/api/especialistas', { signal });
  if (!Array.isArray(crudo)) throw new ApiError(502, MENSAJE_LISTA);
  return crudo.map(aEspecialista).filter((e): e is Especialista => e !== null);
}

// HU-20 — GET /api/especialistas/{id}: perfil de un especialista (404 si no existe o no está activo)
export async function obtenerEspecialista(idEspecialista: number, signal?: AbortSignal): Promise<Especialista> {
  if (MODO_SIMULADO) {
    const encontrado = especialistaSimulado(idEspecialista);
    if (!encontrado) throw await demora(new ApiError(404, 'No encontramos lo que buscabas.'), signal);
    return demora(encontrado, signal);
  }
  const especialista = aEspecialista(await request<unknown>(`/api/especialistas/${idEspecialista}`, { signal }));
  if (!especialista) throw new ApiError(502, MENSAJE_LISTA);
  return especialista;
}

// HU-21 — PUT /api/especialistas/{id} (solo ROLE_ADMIN). 200 con el especialista; 400 con
// { campo: mensaje } si faltan datos o tienen mal formato; 409 (o 400 con texto) si el correo ya
// pertenece a otra cuenta. El cambio se ve de inmediato en toda la plataforma.
export async function actualizarEspecialista(
  idEspecialista: number,
  data: EspecialistaUpdate,
  signal?: AbortSignal,
): Promise<Especialista> {
  if (MODO_SIMULADO) {
    if (leerSesionSimulada()?.rol !== 'ROLE_ADMIN') throw await demora(new ApiError(403, MENSAJE_SIN_PERMISO), signal);
    const actual = especialistaSimulado(idEspecialista);
    if (!actual) throw await demora(new ApiError(404, 'No encontramos lo que buscabas.'), signal);

    const correo = data.correo.toLowerCase();
    if (correo !== actual.correo.toLowerCase() && correosRegistrados().has(correo)) {
      throw await demora(new ApiError(409, MENSAJE_CORREO_DUPLICADO), signal);
    }
    correosRegistrados().delete(actual.correo.toLowerCase());
    correosRegistrados().add(correo);
    PERFILES[idEspecialista] = {
      idUsuario: idEspecialista,
      nombre: data.nombre,
      apellido: data.apellido,
      correo: data.correo,
      telefono: data.telefono ?? null,
    };
    if (data.registroMedico) REGISTROS_MEDICOS[idEspecialista] = data.registroMedico;
    else delete REGISTROS_MEDICOS[idEspecialista];
    // El nombre también se ve en las especialidades que atiende
    for (const e of ESPECIALIDADES) {
      if (e.especialista?.idUsuario === idEspecialista) {
        e.especialista = { idUsuario: idEspecialista, nombre: data.nombre, apellido: data.apellido };
      }
    }
    return demora(especialistaSimulado(idEspecialista)!, signal);
  }
  const editado = aEspecialista(await request<unknown>(`/api/especialistas/${idEspecialista}`, { method: 'PUT', body: data, signal }));
  if (!editado) throw new ApiError(502, MENSAJE_EDICION);
  return editado;
}
