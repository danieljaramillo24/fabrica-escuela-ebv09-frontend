import type { Cita } from '../types/cita';

const ETIQUETAS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  REPROGRAMADA: 'Reprogramada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
};

const CLASES: Record<string, string> = {
  CANCELADA: 'text-red-700',
  COMPLETADA: 'text-slate-700',
};

export function etiquetaEstadoCita(estado: string): string {
  return ETIQUETAS[estado] ?? estado;
}

export function claseEstadoCita(estado: string): string {
  return CLASES[estado] ?? 'text-green-800';
}

/** Una cita que ya terminó o se canceló no admite cambios (HU-14, escenario 2) */
export function citaVigente(cita: Cita, ahora: Date = new Date()): boolean {
  if (cita.estado === 'CANCELADA' || cita.estado === 'COMPLETADA') return false;
  return new Date(`${cita.fecha}T${cita.hora}:00`).getTime() > ahora.getTime();
}

/** HU-13: ordenadas por fecha y hora, las más próximas primero */
export function ordenarCitas(citas: Cita[]): Cita[] {
  return [...citas].sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
}
