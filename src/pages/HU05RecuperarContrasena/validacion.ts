import { esCorreoValido } from '../../utils/validaciones';
import { MIN_CONTRASENA } from '../HU01RegistroDeCliente/validacion';

// HU-05 — Recuperar contraseña. Validación de apoyo: la del servidor manda (RF-05.3 pide validar
// la fortaleza de la nueva clave antes de guardarla).

export { MIN_CONTRASENA };

export type CampoRecuperacion = 'correo';
export type ErroresRecuperacion = Partial<Record<CampoRecuperacion, string>>;

export function validarRecuperacion(correo: string): ErroresRecuperacion {
  const texto = correo.trim();
  if (!texto) return { correo: 'Ingresa el correo con el que te registraste.' };
  if (!esCorreoValido(texto)) return { correo: 'Revisa el formato del correo. Por ejemplo: nombre@correo.com.' };
  return {};
}

export type CampoRestablecer = 'contrasena' | 'confirmarContrasena';
export type ValoresRestablecer = Record<CampoRestablecer, string>;
export type ErroresRestablecer = Partial<Record<CampoRestablecer, string>>;

// Orden del formulario: se usa para enfocar el primer campo con error
export const CAMPOS_RESTABLECER: CampoRestablecer[] = ['contrasena', 'confirmarContrasena'];
export const VALORES_INICIALES_RESTABLECER: ValoresRestablecer = { contrasena: '', confirmarContrasena: '' };

export function validarRestablecer(valores: ValoresRestablecer): ErroresRestablecer {
  const errores: ErroresRestablecer = {};

  // Las contraseñas no se recortan: los espacios pueden ser parte de la clave
  if (!valores.contrasena) {
    errores.contrasena = 'Crea tu nueva contraseña.';
  } else if (valores.contrasena.length < MIN_CONTRASENA) {
    errores.contrasena = `La contraseña debe tener mínimo ${MIN_CONTRASENA} caracteres.`;
  }

  if (!valores.confirmarContrasena) {
    errores.confirmarContrasena = 'Confirma tu nueva contraseña.';
  } else if (valores.contrasena !== valores.confirmarContrasena) {
    errores.confirmarContrasena = 'Las contraseñas no coinciden.';
  }

  return errores;
}

export function esCampoRestablecer(clave: string): clave is CampoRestablecer {
  return (CAMPOS_RESTABLECER as string[]).includes(clave);
}
