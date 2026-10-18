import type { EspecialistaRequest } from '../../types/usuario';
import { esCorreoValido, esTelefonoValido } from '../../utils/validaciones';

// HU-04 — Registro de especialistas. Validación de apoyo: la del servidor manda (incluido el
// correo duplicado, que solo el servidor puede saber).

export type CampoEspecialista = 'nombre' | 'apellido' | 'correo' | 'telefono' | 'registroMedico' | 'contrasena';
export type ValoresEspecialista = Record<CampoEspecialista, string>;
export type ErroresEspecialista = Partial<Record<CampoEspecialista, string>>;

// Orden del formulario: se usa para enfocar el primer campo con error
export const CAMPOS_ESPECIALISTA: CampoEspecialista[] = [
  'nombre',
  'apellido',
  'correo',
  'telefono',
  'registroMedico',
  'contrasena',
];

export const VALORES_INICIALES_ESPECIALISTA: ValoresEspecialista = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  registroMedico: '',
  contrasena: '',
};

// Igual que la contraseña de cualquier cuenta (@Size(min = 8) en el backend)
export const MIN_CONTRASENA = 8;

export function validarEspecialista(valores: ValoresEspecialista): ErroresEspecialista {
  const errores: ErroresEspecialista = {};

  if (!valores.nombre.trim()) errores.nombre = 'Ingresa el nombre del especialista.';
  if (!valores.apellido.trim()) errores.apellido = 'Ingresa el apellido del especialista.';

  const correo = valores.correo.trim();
  if (!correo) {
    errores.correo = 'Ingresa el correo electrónico del especialista.';
  } else if (!esCorreoValido(correo)) {
    errores.correo = 'Revisa el formato del correo. Por ejemplo: especialista@clinica.com.';
  }

  const telefono = valores.telefono.trim();
  if (telefono && !esTelefonoValido(telefono)) {
    errores.telefono = 'El teléfono debe tener entre 7 y 15 dígitos, sin espacios ni signos.';
  }

  // Las contraseñas no se recortan: los espacios pueden ser parte de la clave
  if (!valores.contrasena) {
    errores.contrasena = 'Define una contraseña temporal para el primer inicio de sesión.';
  } else if (valores.contrasena.length < MIN_CONTRASENA) {
    errores.contrasena = `La contraseña debe tener mínimo ${MIN_CONTRASENA} caracteres.`;
  }

  return errores;
}

export function construirSolicitudEspecialista(valores: ValoresEspecialista): EspecialistaRequest {
  const telefono = valores.telefono.trim();
  const registroMedico = valores.registroMedico.trim();
  return {
    nombre: valores.nombre.trim(),
    apellido: valores.apellido.trim(),
    correo: valores.correo.trim(),
    contrasena: valores.contrasena,
    ...(telefono ? { telefono } : {}),
    ...(registroMedico ? { registroMedico } : {}),
  };
}

export function esCampoEspecialista(clave: string): clave is CampoEspecialista {
  return (CAMPOS_ESPECIALISTA as string[]).includes(clave);
}
