// HU-12, HU-13, HU-14 y HU-15 — Citas. Contrato de /api/citas

export interface CitaRequest {
  idHorario: number;
  motivo?: string;
}

/** Lo que el backend devuelve al crear la cita: lo mínimo que exige la confirmación (HU-12) */
export interface CitaCreada {
  idCita: number;
  especialidad: string;
  /** AAAA-MM-DD */
  fecha: string;
  /** HH:mm */
  horaInicio: string;
  estado: string;
}

/** Una cita tal como la muestra la interfaz (HU-13). El backend responde con la entidad completa. */
export interface Cita {
  idCita: number;
  idEspecialidad: number;
  especialidad: string;
  duracionMinutos: number;
  idEspecialista: number | null;
  /** Nombre y apellido del especialista */
  especialista: string;
  /** AAAA-MM-DD */
  fecha: string;
  /** HH:mm */
  hora: string;
  /** PROGRAMADA, CONFIRMADA, CANCELADA, REPROGRAMADA, COMPLETADA (o PENDIENTE) */
  estado: string;
}

/** HU-15 — PUT /api/citas/{id}/reprogramar */
export interface ReprogramarRequest {
  idHorario: number;
}
