import type { InformeGeneral, RangoFechas } from '../types/informe';
import { ApiError, request } from './api';
import { MODO_SIMULADO } from './modo';
import { ESPECIALISTAS_IDS, PERFILES, citas, demora, horarios } from './simulado/almacen';

const MENSAJE_INFORME =
  'No pudimos cargar el informe porque el servicio respondió de forma inesperada. Inténtalo de nuevo más tarde.';

const CLAVES: (keyof InformeGeneral)[] = [
  'totalPacientes',
  'totalEspecialistas',
  'citasProgramadas',
  'citasCanceladas',
  'citasRealizadas',
];

// Solo se aceptan totales numéricos y no negativos: lo demás no se muestra como si fuera un dato
export function aInforme(crudo: unknown): InformeGeneral | null {
  if (typeof crudo !== 'object' || crudo === null) return null;
  const objeto = crudo as Record<string, unknown>;
  const informe = {} as InformeGeneral;
  for (const clave of CLAVES) {
    const valor = objeto[clave];
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) return null;
    informe[clave] = valor;
  }
  return informe;
}

// HU-19 — GET /api/informes/general?desde=AAAA-MM-DD&hasta=AAAA-MM-DD (solo ROLE_ADMIN; ambas
// fechas son opcionales y 403 si no es administrador). Devuelve los totales de pacientes,
// especialistas y citas del periodo; con cero registros responde ceros, no un error.
export async function obtenerInformeGeneral(rango: RangoFechas = {}, signal?: AbortSignal): Promise<InformeGeneral> {
  if (MODO_SIMULADO) {
    const enRango = (fecha: string) => (!rango.desde || fecha >= rango.desde) && (!rango.hasta || fecha <= rango.hasta);
    const delPeriodo = citas.filter((c) => {
      const horario = horarios.find((h) => h.idHorario === c.idHorario);
      return horario ? enRango(horario.fecha) : false;
    });
    const cuenta = (estados: string[]) => delPeriodo.filter((c) => estados.includes(c.estado)).length;
    return demora(
      {
        totalPacientes: Object.keys(PERFILES).filter((id) => !ESPECIALISTAS_IDS.has(Number(id)) && Number(id) !== 1).length,
        totalEspecialistas: ESPECIALISTAS_IDS.size,
        citasProgramadas: cuenta(['PROGRAMADA', 'CONFIRMADA', 'REPROGRAMADA', 'PENDIENTE']),
        citasCanceladas: cuenta(['CANCELADA']),
        citasRealizadas: cuenta(['COMPLETADA']),
      },
      signal,
    );
  }

  const consulta = new URLSearchParams();
  if (rango.desde) consulta.set('desde', rango.desde);
  if (rango.hasta) consulta.set('hasta', rango.hasta);
  const parametros = consulta.toString();
  const informe = aInforme(await request<unknown>(`/api/informes/general${parametros ? `?${parametros}` : ''}`, { signal }));
  if (!informe) throw new ApiError(502, MENSAJE_INFORME);
  return informe;
}
