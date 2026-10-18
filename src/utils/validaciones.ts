// Validaciones de formato compartidas por los formularios.
// Sirven para mejorar la experiencia; la validación del servidor sigue siendo la que manda.

import { esFechaValida } from './fechas';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esCorreoValido(correo: string): boolean {
  return FORMATO_CORREO.test(correo.trim());
}

export function tieneErrores(errores: object): boolean {
  return Object.keys(errores).length > 0;
}

// Teléfono opcional: entre 7 y 15 dígitos, como valida el backend en el perfil (PerfilRequest)
const FORMATO_TELEFONO = /^\d{7,15}$/;

export function esTelefonoValido(telefono: string): boolean {
  return FORMATO_TELEFONO.test(telefono.trim());
}

// El backend responde en texto plano "Ya existe una cuenta registrada con ese correo".
// Si el texto cambiara, simplemente se mostraría el mensaje tal cual (sin el enlace a login).
export function esCorreoDuplicado(mensaje: string): boolean {
  return /ya existe una cuenta/i.test(mensaje);
}

/**
 * Error de una fecha ya escrita (AAAA-MM-DD): debe ser real y no anterior a hoy. Devuelve null si
 * es válida. Si falta la fecha, cada formulario decide si es obligatoria.
 */
export function errorDeFechaFutura(fecha: string, hoy: string): string | null {
  if (!esFechaValida(fecha)) return 'Revisa la fecha. Debe ser una fecha real, por ejemplo 22/09/2026.';
  if (fecha < hoy) return 'La fecha no puede ser anterior a hoy.';
  return null;
}
