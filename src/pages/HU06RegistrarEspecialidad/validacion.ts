import type { EspecialidadRequest } from '../../types/especialidad';

// HU-06 — Registrar especialidad. Validación de apoyo: la del servidor (@NotBlank, @Positive) manda.

export type CampoEspecialidad = 'nombreEspecialidad' | 'descripcion' | 'duracionMinutos';
export type ValoresEspecialidad = Record<CampoEspecialidad, string>;
export type ErroresEspecialidad = Partial<Record<CampoEspecialidad, string>>;

// Orden del formulario: se usa para enfocar el primer campo con error
export const CAMPOS_ESPECIALIDAD: CampoEspecialidad[] = ['nombreEspecialidad', 'descripcion', 'duracionMinutos'];

export const VALORES_INICIALES_ESPECIALIDAD: ValoresEspecialidad = {
  nombreEspecialidad: '',
  descripcion: '',
  duracionMinutos: '',
};

// La columna `descripcion` de la tabla especialidad admite 1000 caracteres
export const MAX_DESCRIPCION = 1000;

const SOLO_DIGITOS = /^[0-9]+$/;

export function validarEspecialidad(valores: ValoresEspecialidad): ErroresEspecialidad {
  const errores: ErroresEspecialidad = {};

  if (!valores.nombreEspecialidad.trim()) {
    errores.nombreEspecialidad = 'Ingresa el nombre de la especialidad.';
  }

  const descripcion = valores.descripcion.trim();
  if (!descripcion) {
    errores.descripcion = 'Describe brevemente en qué consiste esta consulta.';
  } else if (descripcion.length > MAX_DESCRIPCION) {
    errores.descripcion = `La descripción admite hasta ${MAX_DESCRIPCION} caracteres.`;
  }

  const duracion = valores.duracionMinutos.trim();
  if (!duracion) {
    errores.duracionMinutos = 'Ingresa la duración de la consulta en minutos.';
  } else if (!SOLO_DIGITOS.test(duracion) || Number(duracion) <= 0) {
    errores.duracionMinutos = 'La duración debe ser un número entero de minutos, mayor que cero.';
  }

  return errores;
}

export function construirSolicitudEspecialidad(valores: ValoresEspecialidad, idEspecialista: number): EspecialidadRequest {
  return {
    nombreEspecialidad: valores.nombreEspecialidad.trim(),
    descripcion: valores.descripcion.trim(),
    duracionMinutos: Number(valores.duracionMinutos.trim()),
    idEspecialista,
  };
}

export function esCampoEspecialidad(clave: string): clave is CampoEspecialidad {
  return (CAMPOS_ESPECIALIDAD as string[]).includes(clave);
}
