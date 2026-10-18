import type { EstadoHorario, Horario } from '../types/horario';

// HU-09 y HU-11 — El horario se distingue por texto y por color (nunca solo por color)
export const ETIQUETA_ESTADO_HORARIO: Record<EstadoHorario, string> = {
  LIBRE: 'Disponible',
  RESERVADO: 'Reservado',
  BLOQUEADO: 'Bloqueado',
};

export const CLASE_ESTADO_HORARIO: Record<EstadoHorario, string> = {
  LIBRE: 'text-green-800',
  RESERVADO: 'text-slate-700',
  BLOQUEADO: 'text-red-700',
};

/** Agrupa los horarios por fecha, de la más próxima a la más lejana y con sus horas en orden */
export function agruparPorFecha(horarios: Horario[]): [string, Horario[]][] {
  const porFecha = new Map<string, Horario[]>();
  for (const horario of [...horarios].sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`))) {
    porFecha.set(horario.fecha, [...(porFecha.get(horario.fecha) ?? []), horario]);
  }
  return [...porFecha.entries()];
}
