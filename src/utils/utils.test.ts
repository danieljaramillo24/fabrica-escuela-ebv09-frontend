import { describe, expect, it } from 'vitest';
import type { Cita } from '../types/cita';
import type { Horario } from '../types/horario';
import { ETIQUETA_ESTADO_HORARIO, agruparPorFecha } from './agenda';
import { citaVigente, claseEstadoCita, etiquetaEstadoCita, ordenarCitas } from './citas';
import { esFechaValida, esHoraValida, fechaCorta, fechaLarga, hoyISO, hora12 } from './fechas';
import {
  errorDeFechaFutura,
  esCorreoDuplicado,
  esCorreoValido,
  esTelefonoValido,
  tieneErrores,
} from './validaciones';
import { MAX_DESCRIPCION, esCampoEspecialidad, validarEspecialidad } from './validacionEspecialidad';

describe('fechas', () => {
  it('da formato a fechas y horas para las personas', () => {
    expect(fechaLarga('2026-09-08')).toBe('Martes 08 de septiembre');
    expect(fechaCorta('2026-09-08')).toBe('Martes 08 sep');
    expect(hora12('14:30')).toBe('02:30 pm');
    expect(hora12('00:05')).toBe('12:05 am');
    expect(hora12('12:00')).toBe('12:00 pm');
  });

  it('rechaza fechas y horas que no existen', () => {
    expect(esFechaValida('2026-02-28')).toBe(true);
    expect(esFechaValida('2026-02-31')).toBe(false);
    expect(esFechaValida('22/09/2026')).toBe(false);
    expect(esHoraValida('23:59')).toBe(true);
    expect(esHoraValida('24:00')).toBe(false);
    expect(esHoraValida('8:00')).toBe(false);
  });

  it('hoyISO devuelve AAAA-MM-DD', () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('validaciones compartidas', () => {
  it('valida el formato del correo', () => {
    expect(esCorreoValido('ana@correo.com')).toBe(true);
    expect(esCorreoValido(' ana@correo.com ')).toBe(true);
    expect(esCorreoValido('ana@correo')).toBe(false);
    expect(esCorreoValido('ana correo.com')).toBe(false);
  });

  it('valida el teléfono: 7 a 15 dígitos', () => {
    expect(esTelefonoValido('3001234567')).toBe(true);
    expect(esTelefonoValido('12345')).toBe(false);
    expect(esTelefonoValido('300 123 4567')).toBe(false);
    expect(esTelefonoValido('300abc4567')).toBe(false);
  });

  it('reconoce el mensaje de correo duplicado del backend', () => {
    expect(esCorreoDuplicado('Ya existe una cuenta registrada con ese correo')).toBe(true);
    expect(esCorreoDuplicado('Otro error')).toBe(false);
  });

  it('tieneErrores distingue un objeto vacío', () => {
    expect(tieneErrores({})).toBe(false);
    expect(tieneErrores({ a: 'x' })).toBe(true);
  });

  it('errorDeFechaFutura exige fecha real y no anterior a hoy', () => {
    expect(errorDeFechaFutura('2026-02-31', '2026-01-01')).toMatch(/fecha real/);
    expect(errorDeFechaFutura('2026-01-01', '2026-01-02')).toMatch(/anterior a hoy/);
    expect(errorDeFechaFutura('2026-01-02', '2026-01-02')).toBeNull();
  });
});

describe('reglas de la especialidad (HU-06 y HU-07)', () => {
  const validos = { nombreEspecialidad: 'Cardiología', descripcion: 'Corazón', duracionMinutos: '30' };

  it('acepta datos completos', () => {
    expect(validarEspecialidad(validos)).toEqual({});
  });

  it('marca los tres campos vacíos', () => {
    const errores = validarEspecialidad({ nombreEspecialidad: ' ', descripcion: '', duracionMinutos: '' });
    expect(Object.keys(errores)).toEqual(['nombreEspecialidad', 'descripcion', 'duracionMinutos']);
  });

  it('limita la descripción y exige una duración entera mayor que cero', () => {
    expect(validarEspecialidad({ ...validos, descripcion: 'x'.repeat(MAX_DESCRIPCION + 1) }).descripcion).toMatch(/hasta/);
    for (const duracion of ['0', '1.5', '-5', 'abc']) {
      expect(validarEspecialidad({ ...validos, duracionMinutos: duracion }).duracionMinutos).toBeDefined();
    }
  });

  it('reconoce los campos conocidos', () => {
    expect(esCampoEspecialidad('descripcion')).toBe(true);
    expect(esCampoEspecialidad('otro')).toBe(false);
  });
});

const horario = (id: number, fecha: string, inicio: string): Horario => ({
  idHorario: id,
  fecha,
  horaInicio: inicio,
  horaFin: '23:00',
  estado: 'LIBRE',
});

describe('agenda', () => {
  it('agrupa por fecha y ordena fechas y horas', () => {
    const grupos = agruparPorFecha([horario(1, '2026-10-02', '09:00'), horario(2, '2026-10-01', '14:00'), horario(3, '2026-10-01', '08:00')]);
    expect(grupos.map(([fecha]) => fecha)).toEqual(['2026-10-01', '2026-10-02']);
    expect(grupos[0][1].map((h) => h.idHorario)).toEqual([3, 2]);
  });

  it('nombra los tres estados', () => {
    expect(ETIQUETA_ESTADO_HORARIO).toEqual({ LIBRE: 'Disponible', RESERVADO: 'Reservado', BLOQUEADO: 'Bloqueado' });
  });
});

const cita = (estado: string, fecha: string, hora = '08:00'): Cita => ({
  idCita: 1,
  idEspecialidad: 1,
  especialidad: 'Cardiología',
  duracionMinutos: 30,
  idEspecialista: 101,
  especialista: 'Carlos Ramírez',
  fecha,
  hora,
  estado,
});

describe('citas', () => {
  const ahora = new Date('2026-10-10T12:00:00');

  it('traduce los estados y deja pasar los desconocidos', () => {
    expect(etiquetaEstadoCita('PROGRAMADA')).toBe('Programada');
    expect(etiquetaEstadoCita('OTRO')).toBe('OTRO');
    expect(claseEstadoCita('CANCELADA')).toBe('text-red-700');
    expect(claseEstadoCita('PROGRAMADA')).toBe('text-green-800');
  });

  it('una cita admite cambios solo si está activa y es futura', () => {
    expect(citaVigente(cita('PROGRAMADA', '2026-10-11'), ahora)).toBe(true);
    expect(citaVigente(cita('PROGRAMADA', '2026-10-09'), ahora)).toBe(false);
    expect(citaVigente(cita('PROGRAMADA', '2026-10-10', '11:00'), ahora)).toBe(false);
    expect(citaVigente(cita('CANCELADA', '2026-10-11'), ahora)).toBe(false);
    expect(citaVigente(cita('COMPLETADA', '2026-10-11'), ahora)).toBe(false);
  });

  it('ordena las citas por fecha y hora', () => {
    const orden = ordenarCitas([cita('PROGRAMADA', '2026-10-12'), cita('PROGRAMADA', '2026-10-11', '15:00'), cita('PROGRAMADA', '2026-10-11', '08:00')]);
    expect(orden.map((c) => `${c.fecha} ${c.hora}`)).toEqual(['2026-10-11 08:00', '2026-10-11 15:00', '2026-10-12 08:00']);
  });
});
