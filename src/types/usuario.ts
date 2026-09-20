// HU-01 — Registro de usuario. Contrato de POST /api/usuarios

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  telefono?: string;
}

export interface UsuarioResponse {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
}
