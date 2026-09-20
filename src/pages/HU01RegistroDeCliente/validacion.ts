import type { RegistroRequest } from '../../types/usuario';

// HU-01 — Registro de usuario. La validación en cliente mejora la experiencia,
// pero NO reemplaza la del servidor (que sigue siendo la que manda).

export type CampoRegistro =
  | 'nombre'
  | 'apellido'
  | 'correo'
  | 'telefono'
  | 'contrasena'
  | 'confirmarContrasena';

export type ValoresRegistro = Record<CampoRegistro, string>;
export type ErroresRegistro = Partial<Record<CampoRegistro, string>>;

// Orden del formulario: se usa para enfocar el primer campo con error
export const CAMPOS_REGISTRO: CampoRegistro[] = [
  'nombre',
  'apellido',
  'correo',
  'telefono',
  'contrasena',
  'confirmarContrasena',
];

export const VALORES_INICIALES: ValoresRegistro = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
};

// Igual que @Size(min = 8) de UsuarioRequest en el backend
export const MIN_CONTRASENA = 8;

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarRegistro(valores: ValoresRegistro): ErroresRegistro {
  const errores: ErroresRegistro = {};

  if (!valores.nombre.trim()) errores.nombre = 'Ingresa tu nombre.';
  if (!valores.apellido.trim()) errores.apellido = 'Ingresa tu apellido.';

  const correo = valores.correo.trim();
  if (!correo) {
    errores.correo = 'Ingresa tu correo electrónico.';
  } else if (!FORMATO_CORREO.test(correo)) {
    errores.correo = 'Revisa el formato del correo. Por ejemplo: nombre@correo.com.';
  }

  // Las contraseñas no se recortan: los espacios pueden ser parte de la clave
  if (!valores.contrasena) {
    errores.contrasena = 'Crea una contraseña.';
  } else if (valores.contrasena.length < MIN_CONTRASENA) {
    errores.contrasena = `La contraseña debe tener mínimo ${MIN_CONTRASENA} caracteres.`;
  }

  if (!valores.confirmarContrasena) {
    errores.confirmarContrasena = 'Confirma tu contraseña.';
  } else if (valores.contrasena !== valores.confirmarContrasena) {
    errores.confirmarContrasena = 'Las contraseñas no coinciden.';
  }

  return errores;
}

export function construirSolicitud(valores: ValoresRegistro): RegistroRequest {
  const telefono = valores.telefono.trim();
  return {
    nombre: valores.nombre.trim(),
    apellido: valores.apellido.trim(),
    correo: valores.correo.trim(),
    contrasena: valores.contrasena,
    confirmarContrasena: valores.confirmarContrasena,
    ...(telefono ? { telefono } : {}),
  };
}

export function esCampoRegistro(clave: string): clave is CampoRegistro {
  return (CAMPOS_REGISTRO as string[]).includes(clave);
}

// El backend responde en texto plano "Ya existe una cuenta registrada con ese correo".
// Si el texto cambiara, simplemente se mostraría el mensaje tal cual (sin el enlace a login).
export function esCorreoDuplicado(mensaje: string): boolean {
  return /ya existe una cuenta/i.test(mensaje);
}
