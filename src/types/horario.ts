// HU-09, HU-10 y HU-11 — Horarios. Contrato propuesto de /api/horarios (docs/integracion-frontend-backend-sprint1.md)

/** Libre, reservado (tiene una cita) o bloqueado por el especialista (HU-11) */
export type EstadoHorario = 'LIBRE' | 'RESERVADO' | 'BLOQUEADO';

export interface Horario {
  idHorario: number;
  /** Fecha concreta, formato AAAA-MM-DD */
  fecha: string;
  /** Formato HH:mm (24 h) */
  horaInicio: string;
  horaFin: string;
  estado: EstadoHorario;
}

export interface HorarioRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}
