import type { RegistroRequest, UsuarioResponse } from '../types/usuario';
import { request } from './api';

// HU-01 — Registro de usuario: POST /api/usuarios (201 con UsuarioResponse, 400 con errores)
export function registrarUsuario(data: RegistroRequest, signal?: AbortSignal): Promise<UsuarioResponse> {
  return request<UsuarioResponse>('/api/usuarios', { method: 'POST', body: data, signal });
}
