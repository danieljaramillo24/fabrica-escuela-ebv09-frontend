// Formato de fechas y horas para la interfaz. El backend trabaja con "AAAA-MM-DD" y "HH:mm"
// (24 h); las personas ven "Lunes 08 de septiembre" y "02:30 pm". Se opera en UTC para que la
// zona horaria del navegador no corra la fecha un día.

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

function aFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

/** true si es una fecha real con formato AAAA-MM-DD (rechaza, por ejemplo, 2026-02-31) */
export function esFechaValida(iso: string): boolean {
  const partes = FORMATO_FECHA.exec(iso);
  if (!partes) return false;
  const fecha = aFecha(iso);
  return fecha.getUTCMonth() === Number(partes[2]) - 1 && fecha.getUTCDate() === Number(partes[3]);
}

export function esHoraValida(hhmm: string): boolean {
  return FORMATO_HORA.test(hhmm);
}

/** Hoy en la zona horaria de la persona, formato AAAA-MM-DD */
export function hoyISO(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${String(ahora.getDate()).padStart(2, '0')}`;
}

/** "2026-09-08" → "Martes 08 de septiembre" */
export function fechaLarga(iso: string): string {
  const fecha = aFecha(iso);
  return `${DIAS[fecha.getUTCDay()]} ${String(fecha.getUTCDate()).padStart(2, '0')} de ${MESES[fecha.getUTCMonth()]}`;
}

/** "2026-09-08" → "Martes 08 sep" */
export function fechaCorta(iso: string): string {
  const fecha = aFecha(iso);
  return `${DIAS[fecha.getUTCDay()]} ${String(fecha.getUTCDate()).padStart(2, '0')} ${MESES[fecha.getUTCMonth()].slice(0, 3)}`;
}

/** "14:30" → "02:30 pm" */
export function hora12(hhmm: string): string {
  const [horas, minutos] = hhmm.split(':').map(Number);
  const sufijo = horas >= 12 ? 'pm' : 'am';
  const hora = horas % 12 === 0 ? 12 : horas % 12;
  return `${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')} ${sufijo}`;
}
