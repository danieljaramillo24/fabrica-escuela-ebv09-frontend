// HU-19 — Informe general. Contrato propuesto de GET /api/informes/general (solo ROLE_ADMIN)

/** Periodo del informe, fechas AAAA-MM-DD. Sin ninguna, el informe abarca todo el historial */
export interface RangoFechas {
  desde?: string;
  hasta?: string;
}

export interface InformeGeneral {
  totalPacientes: number;
  totalEspecialistas: number;
  citasProgramadas: number;
  citasCanceladas: number;
  citasRealizadas: number;
}
