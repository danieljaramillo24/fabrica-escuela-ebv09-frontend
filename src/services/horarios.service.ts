import type { EstadoHorario, Horario, HorarioRequest } from '../types/horario';
import { ApiError, request } from './api';
import { MODO_SIMULADO } from './modo';
import {
  aHorarioPublico,
  demora,
  horarios,
  leerSesionSimulada,
  nuevoIdHorario,
} from './simulado/almacen';

const MENSAJE_LISTA =
  'No pudimos cargar los horarios porque el servicio respondió de forma inesperada. Inténtalo de nuevo más tarde.';
const MENSAJE_REGISTRO =
  'El horario pudo haberse guardado, pero el servicio respondió de forma inesperada. Revisa tu agenda.';
const MENSAJE_SUPERPUESTO = 'Ya existe un horario que se superpone con ese rango.';
const MENSAJE_SIN_SESION = 'Tu sesión no es válida o expiró. Inicia sesión de nuevo para continuar.';
const MENSAJE_CON_CITA =
  'Este horario tiene una cita reservada. Cancélala o reprográmala antes de bloquearlo.';

/** El horario por el que se pregunta: la especialidad, y su especialista si ya se conoce */
export interface ReferenciaEspecialidad {
  idEspecialidad: number;
  idEspecialista: number | null;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

// El backend serializa LocalTime como "08:00" o "08:00:00": la interfaz trabaja con HH:mm
function normalizarHora(valor: unknown): string | null {
  return typeof valor === 'string' && /^\d{2}:\d{2}/.test(valor) ? valor.slice(0, 5) : null;
}

function normalizarEstado(crudo: Record<string, unknown>): EstadoHorario {
  const { estado, disponible } = crudo;
  if (estado === 'LIBRE' || estado === 'RESERVADO' || estado === 'BLOQUEADO') return estado;
  // Respuesta con solo `disponible`: lo no disponible se trata como reservado (no se ofrece)
  return disponible === false ? 'RESERVADO' : 'LIBRE';
}

export function aHorario(crudo: unknown): Horario | null {
  if (!esObjeto(crudo)) return null;
  const { idHorario, fecha } = crudo;
  const horaInicio = normalizarHora(crudo.horaInicio);
  const horaFin = normalizarHora(crudo.horaFin);
  if (typeof idHorario !== 'number' || typeof fecha !== 'string' || !horaInicio || !horaFin) return null;
  return { idHorario, fecha: fecha.slice(0, 10), horaInicio, horaFin, estado: normalizarEstado(crudo) };
}

function aListaDeHorarios(crudo: unknown): Horario[] {
  if (!Array.isArray(crudo)) throw new ApiError(502, MENSAJE_LISTA);
  return crudo.map(aHorario).filter((h): h is Horario => h !== null);
}

const seSuperponen = (a: { horaInicio: string; horaFin: string }, b: { horaInicio: string; horaFin: string }) =>
  a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;

function sesionSimulada() {
  const sesion = leerSesionSimulada();
  if (!sesion) throw new ApiError(401, MENSAJE_SIN_SESION);
  return sesion;
}

// HU-09 — GET /api/horarios/especialista/{idEspecialista}: la agenda de un especialista
export async function listarHorariosDeEspecialista(idEspecialista: number, signal?: AbortSignal): Promise<Horario[]> {
  if (MODO_SIMULADO) {
    return demora(horarios.filter((h) => h.idEspecialista === idEspecialista).map(aHorarioPublico), signal);
  }
  return aListaDeHorarios(await request<unknown>(`/api/horarios/especialista/${idEspecialista}`, { signal }));
}

// HU-09 — POST /api/horarios (ROLE_ESPECIALISTA). El backend toma el especialista de la sesión.
// 201 con el horario; 400 { campo: mensaje }; 409 si se superpone con otro de la misma fecha.
export async function crearHorario(data: HorarioRequest, signal?: AbortSignal): Promise<Horario> {
  if (MODO_SIMULADO) {
    const sesion = sesionSimulada();
    const choca = horarios.some((h) => h.idEspecialista === sesion.idUsuario && h.fecha === data.fecha && seSuperponen(h, data));
    if (choca) throw await demora(new ApiError(409, MENSAJE_SUPERPUESTO), signal);
    const nuevo = { idHorario: nuevoIdHorario(), idEspecialista: sesion.idUsuario, ...data, estado: 'LIBRE' as const };
    horarios.push(nuevo);
    return demora(aHorarioPublico(nuevo), signal);
  }

  const creado = aHorario(await request<unknown>('/api/horarios', { method: 'POST', body: data, signal }));
  if (!creado) throw new ApiError(502, MENSAJE_REGISTRO);
  return creado;
}

// HU-10 y HU-12 — GET /api/horarios/disponibles?idEspecialidad=…&fecha=…: horarios libres del
// especialista de esa especialidad, y de una fecha concreta si se indica (AAAA-MM-DD). Nunca
// devuelve horarios reservados ni bloqueados. En modo simulado se necesita el especialista.
export async function listarHorariosDisponibles(
  referencia: ReferenciaEspecialidad,
  signal?: AbortSignal,
  fecha?: string,
): Promise<Horario[]> {
  if (MODO_SIMULADO) {
    const hoy = new Date().toISOString().slice(0, 10);
    const libres = horarios
      .filter(
        (h) =>
          h.idEspecialista === referencia.idEspecialista &&
          h.estado === 'LIBRE' &&
          h.fecha >= hoy &&
          (!fecha || h.fecha === fecha),
      )
      .map(aHorarioPublico);
    return demora(libres, signal);
  }
  const consulta = new URLSearchParams({ idEspecialidad: String(referencia.idEspecialidad) });
  if (fecha) consulta.set('fecha', fecha);
  return aListaDeHorarios(await request<unknown>(`/api/horarios/disponibles?${consulta}`, { signal }));
}

async function cambiarBloqueo(idHorario: number, accion: 'bloquear' | 'desbloquear', signal?: AbortSignal): Promise<Horario> {
  if (MODO_SIMULADO) {
    const sesion = sesionSimulada();
    const horario = horarios.find((h) => h.idHorario === idHorario);
    if (!horario || horario.idEspecialista !== sesion.idUsuario) {
      throw await demora(new ApiError(403, 'No tienes permiso para realizar esta acción.'), signal);
    }
    if (accion === 'bloquear' && horario.estado === 'RESERVADO') {
      throw await demora(new ApiError(409, MENSAJE_CON_CITA), signal);
    }
    if (accion === 'bloquear' && horario.estado === 'LIBRE') horario.estado = 'BLOQUEADO';
    if (accion === 'desbloquear' && horario.estado === 'BLOQUEADO') horario.estado = 'LIBRE';
    return demora(aHorarioPublico(horario), signal);
  }

  const actualizado = aHorario(await request<unknown>(`/api/horarios/${idHorario}/${accion}`, { method: 'PUT', signal }));
  if (!actualizado) throw new ApiError(502, MENSAJE_LISTA);
  return actualizado;
}

// HU-11 — PUT /api/horarios/{id}/bloquear (ROLE_ESPECIALISTA, solo su agenda).
// 200 con el horario; 409 si tiene una cita reservada; 403 si no es su horario.
export function bloquearHorario(idHorario: number, signal?: AbortSignal): Promise<Horario> {
  return cambiarBloqueo(idHorario, 'bloquear', signal);
}

// HU-11 — PUT /api/horarios/{id}/desbloquear: el horario vuelve a ofrecerse a los pacientes
export function desbloquearHorario(idHorario: number, signal?: AbortSignal): Promise<Horario> {
  return cambiarBloqueo(idHorario, 'desbloquear', signal);
}
