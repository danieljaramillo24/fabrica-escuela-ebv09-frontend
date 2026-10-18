import type { Perfil, PerfilRequest } from '../../types/usuario';
import { esCorreoValido, esTelefonoValido } from '../../utils/validaciones';

// HU-03 — Gestión de perfil. Validación de apoyo: la del servidor manda (RF-03.3).

export type CampoPerfil = 'nombre' | 'apellido' | 'correo' | 'telefono';
export type ValoresPerfil = Record<CampoPerfil, string>;
export type ErroresPerfil = Partial<Record<CampoPerfil, string>>;

// Orden del formulario: se usa para enfocar el primer campo con error
export const CAMPOS_PERFIL: CampoPerfil[] = ['nombre', 'apellido', 'correo', 'telefono'];

export function valoresDesdePerfil(perfil: Perfil): ValoresPerfil {
  return { nombre: perfil.nombre, apellido: perfil.apellido, correo: perfil.correo, telefono: perfil.telefono ?? '' };
}

export function validarPerfil(valores: ValoresPerfil): ErroresPerfil {
  const errores: ErroresPerfil = {};

  if (!valores.nombre.trim()) errores.nombre = 'Ingresa tu nombre.';
  if (!valores.apellido.trim()) errores.apellido = 'Ingresa tu apellido.';

  const correo = valores.correo.trim();
  if (!correo) {
    errores.correo = 'Ingresa tu correo electrónico.';
  } else if (!esCorreoValido(correo)) {
    errores.correo = 'Revisa el formato del correo. Por ejemplo: nombre@correo.com.';
  }

  const telefono = valores.telefono.trim();
  if (telefono && !esTelefonoValido(telefono)) {
    errores.telefono = 'El teléfono debe tener entre 7 y 15 dígitos, sin espacios ni signos.';
  }

  return errores;
}

export function construirSolicitudPerfil(valores: ValoresPerfil): PerfilRequest {
  const telefono = valores.telefono.trim();
  return {
    nombre: valores.nombre.trim(),
    apellido: valores.apellido.trim(),
    correo: valores.correo.trim(),
    ...(telefono ? { telefono } : {}),
  };
}

export function sinCambios(valores: ValoresPerfil, guardado: ValoresPerfil): boolean {
  return CAMPOS_PERFIL.every((campo) => valores[campo].trim() === guardado[campo].trim());
}

export function esCampoPerfil(clave: string): clave is CampoPerfil {
  return (CAMPOS_PERFIL as string[]).includes(clave);
}
