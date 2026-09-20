import { esCorreoValido } from '../../utils/validaciones';

// HU-02 — Inicio de sesión. Solo se valida que los datos estén completos y con formato:
// la longitud de la contraseña no se comprueba aquí para no dar pistas sobre la regla.

export type CampoLogin = 'correo' | 'contrasena';
export type ValoresLogin = Record<CampoLogin, string>;
export type ErroresLogin = Partial<Record<CampoLogin, string>>;

export const CAMPOS_LOGIN: CampoLogin[] = ['correo', 'contrasena'];
export const VALORES_INICIALES_LOGIN: ValoresLogin = { correo: '', contrasena: '' };

export function validarLogin(valores: ValoresLogin): ErroresLogin {
  const errores: ErroresLogin = {};

  const correo = valores.correo.trim();
  if (!correo) {
    errores.correo = 'Ingresa tu correo electrónico.';
  } else if (!esCorreoValido(correo)) {
    errores.correo = 'Revisa el formato del correo. Por ejemplo: nombre@correo.com.';
  }

  if (!valores.contrasena) errores.contrasena = 'Ingresa tu contraseña.';

  return errores;
}
