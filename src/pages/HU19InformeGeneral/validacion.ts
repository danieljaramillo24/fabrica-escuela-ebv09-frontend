import type { RangoFechas } from '../../types/informe';
import { esFechaValida } from '../../utils/fechas';

// HU-19 — Informe general. El filtro por fechas es opcional: puede indicarse solo "desde", solo
// "hasta" o ambas. A diferencia de las agendas, un informe sí puede mirar fechas pasadas.

export type CampoRango = 'desde' | 'hasta';
export type ValoresRango = Record<CampoRango, string>;
export type ErroresRango = Partial<Record<CampoRango, string>>;

export const CAMPOS_RANGO: CampoRango[] = ['desde', 'hasta'];
export const VALORES_INICIALES_RANGO: ValoresRango = { desde: '', hasta: '' };

export function validarRango(valores: ValoresRango): ErroresRango {
  const errores: ErroresRango = {};

  if (valores.desde && !esFechaValida(valores.desde)) {
    errores.desde = 'Revisa la fecha inicial. Debe ser una fecha real, por ejemplo 01/09/2026.';
  }
  if (valores.hasta && !esFechaValida(valores.hasta)) {
    errores.hasta = 'Revisa la fecha final. Debe ser una fecha real, por ejemplo 30/09/2026.';
  }
  if (!errores.desde && !errores.hasta && valores.desde && valores.hasta && valores.hasta < valores.desde) {
    errores.hasta = 'La fecha final no puede ser anterior a la fecha inicial.';
  }

  return errores;
}

/** Solo viajan al servidor las fechas que se escribieron */
export function construirRango(valores: ValoresRango): RangoFechas {
  return {
    ...(valores.desde ? { desde: valores.desde } : {}),
    ...(valores.hasta ? { hasta: valores.hasta } : {}),
  };
}
