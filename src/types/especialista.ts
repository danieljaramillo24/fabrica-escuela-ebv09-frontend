// HU-20 y HU-21 — Especialistas. Contrato propuesto de GET/PUT /api/especialistas
// (el POST de HU-04 usa `EspecialistaRequest`, en types/usuario.ts)

/** Especialidad que atiende un especialista: con el id se puede pedir la cita (HU-12) */
export interface EspecialidadDeEspecialista {
  idEspecialidad: number;
  nombreEspecialidad: string;
}

export interface Especialista {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  registroMedico: string | null;
  especialidades: EspecialidadDeEspecialista[];
}

/** HU-21 — PUT /api/especialistas/{id}: solo ROLE_ADMIN. No cambia la contraseña ni el rol */
export interface EspecialistaUpdate {
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  registroMedico?: string;
}
