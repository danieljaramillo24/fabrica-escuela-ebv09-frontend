// HU-02 — Inicio de sesión. Contrato de /api/auth/* (ver .kiro/steering/security.md)
//
// La sesión vive en una cookie HttpOnly que pone el backend: el frontend nunca ve el token.
// Solo conserva en memoria quién es la persona (id, nombre y rol) para adaptar la interfaz.

export type Rol = 'ROLE_USUARIO' | 'ROLE_ESPECIALISTA' | 'ROLE_ADMIN';

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

/** Lo que el frontend conserva de la sesión iniciada */
export interface Sesion {
  idUsuario: number;
  nombre: string;
  rol: Rol;
}

/** Respuesta de POST /api/auth/login y de GET /api/auth/me (la cookie viaja en `Set-Cookie`) */
export type LoginResponse = Sesion;
