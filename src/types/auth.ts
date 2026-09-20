// HU-02 — Inicio de sesión. Contrato de POST /api/auth/login (ver .kiro/steering/security.md)

export type Rol = 'ROLE_USUARIO' | 'ROLE_ESPECIALISTA' | 'ROLE_ADMIN';

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  /** Normalmente "Bearer" */
  tipo?: string;
  idUsuario: number;
  nombre: string;
  rol: Rol;
}

/** Lo que el frontend conserva de la sesión iniciada */
export interface Sesion {
  token: string;
  idUsuario: number;
  nombre: string;
  rol: Rol;
}
