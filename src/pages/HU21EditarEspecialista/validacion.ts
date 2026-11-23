import type { Especialista, EspecialistaUpdate } from '../../types/especialista';
import { esCorreoValido, esTelefonoValido } from '../../utils/validaciones';

// HU-21 — Editar especialista. Validación de apoyo (RF-21.2): la del servidor manda, incluido el
// correo duplicado (RF-21.3), que solo el servidor puede saber.

export type CampoEdicionEspecialista = 'nombre' | 'apellido' | 'correo' | 'telefono' | 'registroMedico';
export type ValoresEdicionEspecialista = Record<CampoEdicionEspecialista, string>;
export type ErroresEdicionEspecialista = Partial<Record<CampoEdicionEspecialista, string>>;

// Orden del formulario: se usa para enfocar el primer campo con error
export const CAMPOS_EDICION_ESPECIALISTA: CampoEdicionEspecialista[] = [
  'nombre',
  'apellido',
  'correo',
  'telefono',
  'registroMedico',
];

export function valoresDesdeEspecialista(especialista: Especialista): ValoresEdicionEspecialista {
  return {
    nombre: especialista.nombre,
    apellido: especialista.apellido,
    correo: especialista.correo,
    telefono: especialista.telefono ?? '',
    registroMedico: especialista.registroMedico ?? '',
  };
}

export function validarEdicionEspecialista(valores: ValoresEdicionEspecialista): ErroresEdicionEspecialista {
  const errores: ErroresEdicionEspecialista = {};

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

  return errores;
}

/** true si algún campo es distinto de lo guardado (ignorando espacios al inicio y al final) */
export function hayCambiosEnEspecialista(actual: ValoresEdicionEspecialista, guardado: ValoresEdicionEspecialista): boolean {
  return CAMPOS_EDICION_ESPECIALISTA.some((campo) => actual[campo].trim() !== guardado[campo].trim());
}

export function construirActualizacionEspecialista(valores: ValoresEdicionEspecialista): EspecialistaUpdate {
  const telefono = valores.telefono.trim();
  const registroMedico = valores.registroMedico.trim();
  return {
    nombre: valores.nombre.trim(),
    apellido: valores.apellido.trim(),
    correo: valores.correo.trim(),
    ...(telefono ? { telefono } : {}),
    ...(registroMedico ? { registroMedico } : {}),
  };
}

export function esCampoEdicionEspecialista(clave: string): clave is CampoEdicionEspecialista {
  return (CAMPOS_EDICION_ESPECIALISTA as string[]).includes(clave);
}
