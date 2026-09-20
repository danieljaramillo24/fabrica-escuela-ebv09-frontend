// Validaciones de formato compartidas por los formularios.
// Sirven para mejorar la experiencia; la validación del servidor sigue siendo la que manda.

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esCorreoValido(correo: string): boolean {
  return FORMATO_CORREO.test(correo.trim());
}

export function tieneErrores(errores: object): boolean {
  return Object.keys(errores).length > 0;
}
