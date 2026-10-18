import type { Cita, CitaCreada, CitaRequest, ReprogramarRequest } from '../types/cita';
import { ApiError, request } from './api';
import { MODO_SIMULADO } from './modo';
import {
  ESPECIALIDADES,
  citas,
  demora,
  horarios,
  leerSesionSimulada,
  nuevoIdCita,
  type CitaAlmacenada,
} from './simulado/almacen';

const MENSAJE_RESPUESTA =
  'La cita pudo haberse registrado, pero el servicio respondió de forma inesperada. Revisa tus citas antes de intentarlo otra vez.';
const MENSAJE_LISTA =
  'No pudimos cargar tus citas porque el servicio respondió de forma inesperada. Inténtalo de nuevo más tarde.';
const MENSAJE_SIN_SESION = 'Tu sesión no es válida o expiró. Inicia sesión de nuevo para continuar.';
const MENSAJE_NO_DISPONIBLE = 'El horario ya no está disponible.';
const MENSAJE_NO_CANCELABLE = 'Esta cita no puede cancelarse porque ya fue cancelada, ya ocurrió o está fuera del periodo permitido.';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}
const texto = (valor: unknown): string | null => (typeof valor === 'string' ? valor : null);
const numero = (valor: unknown): number | null =>
  typeof valor === 'number' && Number.isFinite(valor) ? valor : null;

// La entidad Cita del backend trae también datos del usuario y del especialista: aquí se copia
// solo lo que la interfaz muestra y nada más se conserva en memoria.
export function aCita(crudo: unknown): Cita | null {
  if (!esObjeto(crudo)) return null;
  const idCita = numero(crudo.idCita);
  const fecha = texto(crudo.fechaCita) ?? texto(crudo.fecha);
  const hora = texto(crudo.horaCita) ?? texto(crudo.horaInicio);
  const especialidad = esObjeto(crudo.especialidad) ? crudo.especialidad : null;
  const especialista = esObjeto(crudo.especialista) ? crudo.especialista : null;
  const idEspecialidad = especialidad ? numero(especialidad.idEspecialidad) : null;
  const nombreEspecialidad = especialidad ? texto(especialidad.nombreEspecialidad) : texto(crudo.especialidad);
  if (idCita === null || !fecha || !hora || nombreEspecialidad === null) return null;

  const nombre = especialista ? texto(especialista.nombre) : null;
  const apellido = especialista ? texto(especialista.apellido) : null;
  return {
    idCita,
    idEspecialidad: idEspecialidad ?? 0,
    especialidad: nombreEspecialidad,
    duracionMinutos: (especialidad ? numero(especialidad.duracionMinutos) : null) ?? 0,
    idEspecialista: especialista ? numero(especialista.idUsuario) : null,
    especialista: [nombre, apellido].filter(Boolean).join(' ') || 'Por asignar',
    fecha: fecha.slice(0, 10),
    hora: hora.slice(0, 5),
    estado: texto(crudo.estado) ?? 'PROGRAMADA',
  };
}

function aCitaCreada(crudo: unknown): CitaCreada | null {
  if (!esObjeto(crudo)) return null;
  const { idCita, especialidad, fecha, horaInicio } = crudo;
  if (typeof idCita !== 'number' || typeof especialidad !== 'string' || typeof fecha !== 'string' || typeof horaInicio !== 'string') {
    return null;
  }
  return {
    idCita,
    especialidad,
    fecha: fecha.slice(0, 10),
    horaInicio: horaInicio.slice(0, 5),
    estado: typeof crudo.estado === 'string' ? crudo.estado : 'PENDIENTE',
  };
}

function sesionSimulada() {
  const sesion = leerSesionSimulada();
  if (!sesion) throw new ApiError(401, MENSAJE_SIN_SESION);
  return sesion;
}

function citaSimulada(almacenada: CitaAlmacenada): Cita {
  const horario = horarios.find((h) => h.idHorario === almacenada.idHorario)!;
  const especialidad = ESPECIALIDADES.find((e) => e.especialista?.idUsuario === horario.idEspecialista);
  return {
    idCita: almacenada.idCita,
    idEspecialidad: especialidad?.idEspecialidad ?? 0,
    especialidad: especialidad?.nombreEspecialidad ?? 'Consulta',
    duracionMinutos: especialidad?.duracionMinutos ?? 30,
    idEspecialista: horario.idEspecialista,
    especialista: especialidad?.especialista ? `${especialidad.especialista.nombre} ${especialidad.especialista.apellido}` : 'Por asignar',
    fecha: horario.fecha,
    hora: horario.horaInicio,
    estado: almacenada.estado,
  };
}

function citaCreadaSimulada(almacenada: CitaAlmacenada): CitaCreada {
  const cita = citaSimulada(almacenada);
  return { idCita: cita.idCita, especialidad: cita.especialidad, fecha: cita.fecha, horaInicio: cita.hora, estado: almacenada.estado };
}

// HU-12 — POST /api/citas (ROLE_USUARIO). El backend toma el usuario de la sesión.
// 201 con la cita; 409 si el horario ya no está disponible o si el usuario ya tiene esa cita.
export async function solicitarCita(data: CitaRequest, signal?: AbortSignal): Promise<CitaCreada> {
  if (MODO_SIMULADO) {
    const sesion = sesionSimulada();
    const horario = horarios.find((h) => h.idHorario === data.idHorario);
    if (horario && citas.some((c) => c.idHorario === horario.idHorario && c.idUsuario === sesion.idUsuario && c.estado !== 'CANCELADA')) {
      throw await demora(new ApiError(409, 'Ya tienes una cita en este horario.'), signal);
    }
    if (!horario || horario.estado !== 'LIBRE') {
      throw await demora(new ApiError(409, MENSAJE_NO_DISPONIBLE), signal);
    }
    horario.estado = 'RESERVADO';
    const nueva: CitaAlmacenada = { idCita: nuevoIdCita(), idHorario: horario.idHorario, idUsuario: sesion.idUsuario, estado: 'PROGRAMADA' };
    citas.push(nueva);
    return demora(citaCreadaSimulada(nueva), signal);
  }

  const creada = aCitaCreada(await request<unknown>('/api/citas', { method: 'POST', body: data, signal }));
  if (!creada) throw new ApiError(502, MENSAJE_RESPUESTA);
  return creada;
}

// HU-13 — GET /api/citas/usuario/{idUsuario}. Lista vacía si no tiene citas. El backend debe
// devolver solo las de la persona de la sesión (403 si el id es de otra).
export async function listarMisCitas(idUsuario: number, signal?: AbortSignal): Promise<Cita[]> {
  if (MODO_SIMULADO) {
    return demora(citas.filter((c) => c.idUsuario === idUsuario).map(citaSimulada), signal);
  }
  const crudo = await request<unknown>(`/api/citas/usuario/${idUsuario}`, { signal });
  if (!Array.isArray(crudo)) throw new ApiError(502, MENSAJE_LISTA);
  return crudo.map(aCita).filter((c): c is Cita => c !== null);
}

// HU-14 — PUT /api/citas/{id}/cancelar (ROLE_USUARIO, solo el dueño de la cita).
// Libera el horario. 409 si ya está cancelada, ya ocurrió o está fuera del periodo permitido.
export async function cancelarCita(idCita: number, signal?: AbortSignal): Promise<void> {
  if (MODO_SIMULADO) {
    const sesion = sesionSimulada();
    const cita = citas.find((c) => c.idCita === idCita && c.idUsuario === sesion.idUsuario);
    const horario = cita && horarios.find((h) => h.idHorario === cita.idHorario);
    if (!cita || !horario) throw await demora(new ApiError(404, 'No encontramos lo que buscabas.'), signal);
    if (cita.estado === 'CANCELADA' || cita.estado === 'COMPLETADA') {
      throw await demora(new ApiError(409, MENSAJE_NO_CANCELABLE), signal);
    }
    cita.estado = 'CANCELADA';
    horario.estado = 'LIBRE';
    await demora(undefined, signal);
    return;
  }
  await request<unknown>(`/api/citas/${idCita}/cancelar`, { method: 'PUT', signal });
}

// HU-15 — PUT /api/citas/{id}/reprogramar con { idHorario } (ROLE_USUARIO, solo el dueño).
// Actualiza la cita y libera el horario anterior en una sola operación; si falla, la cita original
// queda igual. 409 si el nuevo horario ya no está disponible.
export async function reprogramarCita(idCita: number, data: ReprogramarRequest, signal?: AbortSignal): Promise<CitaCreada> {
  if (MODO_SIMULADO) {
    const sesion = sesionSimulada();
    const cita = citas.find((c) => c.idCita === idCita && c.idUsuario === sesion.idUsuario);
    const anterior = cita && horarios.find((h) => h.idHorario === cita.idHorario);
    if (!cita || !anterior) throw await demora(new ApiError(404, 'No encontramos lo que buscabas.'), signal);
    const nuevo = horarios.find((h) => h.idHorario === data.idHorario);
    if (!nuevo || nuevo.estado !== 'LIBRE') throw await demora(new ApiError(409, MENSAJE_NO_DISPONIBLE), signal);
    anterior.estado = 'LIBRE';
    nuevo.estado = 'RESERVADO';
    cita.idHorario = nuevo.idHorario;
    cita.estado = 'REPROGRAMADA';
    return demora(citaCreadaSimulada(cita), signal);
  }

  const reprogramada = aCitaCreada(await request<unknown>(`/api/citas/${idCita}/reprogramar`, { method: 'PUT', body: data, signal }));
  if (!reprogramada) throw new ApiError(502, MENSAJE_RESPUESTA);
  return reprogramada;
}
