// HU-01 — Registro de usuario. Contrato de POST /api/usuarios

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  telefono?: string;
  /** HU-25: la persona aceptó el tratamiento de sus datos personales */
  autorizaTratamientoDatos?: boolean;
}

export interface UsuarioResponse {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
}

/** HU-03 — Datos personales de la cuenta. Contrato de GET/PUT /api/usuarios/{id} */
export type Perfil = UsuarioResponse;

export interface PerfilRequest {
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
}

/** HU-04 — Registro de especialistas. Contrato propuesto de POST /api/especialistas (solo administrador) */
export interface EspecialistaRequest {
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  /** Contraseña temporal con la que el especialista inicia sesión por primera vez */
  contrasena: string;
  registroMedico?: string;
}
