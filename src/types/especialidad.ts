// HU-06 y HU-08 — Especialidades. Contrato de /api/especialidades

/** Solo los datos del especialista que la interfaz muestra */
export interface EspecialistaResumen {
  idUsuario: number;
  nombre: string;
  apellido: string;
}

export interface Especialidad {
  idEspecialidad: number;
  nombreEspecialidad: string;
  descripcion: string;
  duracionMinutos: number;
  especialista: EspecialistaResumen | null;
}

export interface EspecialidadRequest {
  nombreEspecialidad: string;
  descripcion: string;
  duracionMinutos: number;
  idEspecialista: number;
}
