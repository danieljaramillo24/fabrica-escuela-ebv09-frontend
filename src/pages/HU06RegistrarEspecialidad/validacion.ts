import type { EspecialidadRequest } from '../../types/especialidad';
import type { ValoresEspecialidad } from '../../utils/validacionEspecialidad';

// HU-06 — Registrar especialidad. Las reglas de los campos viven en utils/validacionEspecialidad
// porque HU-07 (editar) usa las mismas; aquí queda lo propio de registrar.
export {
  CAMPOS_ESPECIALIDAD,
  MAX_DESCRIPCION,
  esCampoEspecialidad,
  validarEspecialidad,
  type CampoEspecialidad,
  type ErroresEspecialidad,
  type ValoresEspecialidad,
} from '../../utils/validacionEspecialidad';

export const VALORES_INICIALES_ESPECIALIDAD: ValoresEspecialidad = {
  nombreEspecialidad: '',
  descripcion: '',
  duracionMinutos: '',
};

export function construirSolicitudEspecialidad(valores: ValoresEspecialidad, idEspecialista: number): EspecialidadRequest {
  return {
    nombreEspecialidad: valores.nombreEspecialidad.trim(),
    descripcion: valores.descripcion.trim(),
    duracionMinutos: Number(valores.duracionMinutos.trim()),
    idEspecialista,
  };
}
