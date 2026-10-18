import type { Horario, HorarioRequest } from '../../types/horario';
import { esHoraValida, hoyISO, hora12 } from '../../utils/fechas';
import { errorDeFechaFutura } from '../../utils/validaciones';

// HU-09 — Definir horarios. Validación de apoyo: la del servidor manda (incluido el conflicto
// de horarios superpuestos, que además se comprueba aquí para avisar antes de enviar).

export type CampoHorario = 'fecha' | 'horaInicio' | 'horaFin';
export type ValoresHorario = Record<CampoHorario, string>;
export type ErroresHorario = Partial<Record<CampoHorario, string>>;

// Orden del formulario: se usa para enfocar el primer campo con error
export const CAMPOS_HORARIO: CampoHorario[] = ['fecha', 'horaInicio', 'horaFin'];

export const VALORES_INICIALES_HORARIO: ValoresHorario = { fecha: '', horaInicio: '08:00', horaFin: '12:00' };

export function validarHorario(
  valores: ValoresHorario,
  existentes: Horario[],
  hoy: string = hoyISO(),
): ErroresHorario {
  const errores: ErroresHorario = {};

  if (!valores.fecha) {
    errores.fecha = 'Selecciona la fecha del horario.';
  } else {
    const errorFecha = errorDeFechaFutura(valores.fecha, hoy);
    if (errorFecha) errores.fecha = errorFecha;
  }

  if (!valores.horaInicio) {
    errores.horaInicio = 'Indica la hora de inicio.';
  } else if (!esHoraValida(valores.horaInicio)) {
    errores.horaInicio = 'Revisa la hora de inicio.';
  }

  if (!valores.horaFin) {
    errores.horaFin = 'Indica la hora de fin.';
  } else if (!esHoraValida(valores.horaFin)) {
    errores.horaFin = 'Revisa la hora de fin.';
  } else if (!errores.horaInicio && valores.horaFin <= valores.horaInicio) {
    errores.horaFin = 'La hora de fin debe ser posterior a la hora de inicio.';
  }

  // Escenario 2 de la HU: no se crean horarios superpuestos
  if (!errores.fecha && !errores.horaInicio && !errores.horaFin) {
    const choca = existentes.find(
      (h) => h.fecha === valores.fecha && valores.horaInicio < h.horaFin && h.horaInicio < valores.horaFin,
    );
    if (choca) {
      errores.horaInicio = `Se cruza con tu horario de ${hora12(choca.horaInicio)} a ${hora12(choca.horaFin)} de ese día. Elige otro rango.`;
    }
  }

  return errores;
}

export function construirSolicitudHorario(valores: ValoresHorario): HorarioRequest {
  return { fecha: valores.fecha, horaInicio: valores.horaInicio, horaFin: valores.horaFin };
}

export function esCampoHorario(clave: string): clave is CampoHorario {
  return (CAMPOS_HORARIO as string[]).includes(clave);
}
