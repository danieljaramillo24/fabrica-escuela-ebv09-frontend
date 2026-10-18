import { describe, expect, it } from 'vitest';
import type { Horario } from '../types/horario';
import { VALORES_INICIALES, construirSolicitud, validarAutorizacion, validarRegistro } from './HU01RegistroDeCliente/validacion';
import { validarLogin } from './HU02InicioDeSesion/validacion';
import { construirSolicitudPerfil, sinCambios, validarPerfil, valoresDesdePerfil } from './HU03GestionDePerfil/validacion';
import { construirSolicitudEspecialista, validarEspecialista } from './HU04RegistroDeEspecialistas/validacion';
import { construirSolicitudEspecialidad } from './HU06RegistrarEspecialidad/validacion';
import { construirSolicitudHorario, validarHorario } from './HU09DefinirHorariosDisponibles/validacion';

describe('HU-01 registro', () => {
  const validos = {
    ...VALORES_INICIALES,
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'ana@correo.com',
    contrasena: 'claveSegura1',
    confirmarContrasena: 'claveSegura1',
  };

  it('acepta datos completos y marca los vacíos', () => {
    expect(validarRegistro(validos)).toEqual({});
    expect(Object.keys(validarRegistro(VALORES_INICIALES))).toEqual(
      expect.arrayContaining(['nombre', 'apellido', 'correo', 'contrasena', 'confirmarContrasena']),
    );
  });

  it('exige contraseña de 8 caracteres y que coincidan', () => {
    expect(validarRegistro({ ...validos, contrasena: 'corta', confirmarContrasena: 'corta' }).contrasena).toMatch(/mínimo 8/);
    expect(validarRegistro({ ...validos, confirmarContrasena: 'otra' }).confirmarContrasena).toMatch(/no coinciden/);
  });

  it('HU-25: sin autorización de datos no se crea la cuenta', () => {
    expect(validarAutorizacion(false)).toMatch(/tratamiento de tus datos/);
    expect(validarAutorizacion(true)).toBeUndefined();
    expect(construirSolicitud(validos, true).autorizaTratamientoDatos).toBe(true);
    expect('telefono' in construirSolicitud(validos, true)).toBe(false);
  });
});

describe('HU-02 login', () => {
  it('pide correo válido y contraseña, sin pistas sobre la regla de la contraseña', () => {
    expect(validarLogin({ correo: '', contrasena: '' })).toEqual({ correo: expect.any(String), contrasena: expect.any(String) });
    expect(validarLogin({ correo: 'mal', contrasena: 'x' }).correo).toMatch(/formato/);
    expect(validarLogin({ correo: 'ana@correo.com', contrasena: 'x' })).toEqual({});
  });
});

describe('HU-03 perfil', () => {
  const perfil = { idUsuario: 1, nombre: 'Ana', apellido: 'Pérez', correo: 'ana@correo.com', telefono: null };

  it('carga los valores y detecta cambios', () => {
    const valores = valoresDesdePerfil(perfil);
    expect(valores.telefono).toBe('');
    expect(sinCambios(valores, valoresDesdePerfil(perfil))).toBe(true);
    expect(sinCambios({ ...valores, nombre: 'Ana María' }, valoresDesdePerfil(perfil))).toBe(false);
  });

  it('valida obligatorios y teléfono opcional', () => {
    const valores = valoresDesdePerfil(perfil);
    expect(validarPerfil(valores)).toEqual({});
    expect(validarPerfil({ ...valores, nombre: '', apellido: ' ' })).toEqual({ nombre: expect.any(String), apellido: expect.any(String) });
    expect(validarPerfil({ ...valores, telefono: '12ab' }).telefono).toBeDefined();
    expect(construirSolicitudPerfil({ ...valores, telefono: ' 3001234567 ' }).telefono).toBe('3001234567');
  });
});

describe('HU-04 registro de especialistas', () => {
  const validos = { nombre: 'Sofía', apellido: 'Torres', correo: 's@clinica.com', telefono: '', registroMedico: '', contrasena: 'temporal123' };

  it('valida correo, teléfono y contraseña temporal', () => {
    expect(validarEspecialista(validos)).toEqual({});
    const errores = validarEspecialista({ ...validos, correo: 'mal', telefono: 'abc', contrasena: 'corta' });
    expect(Object.keys(errores)).toEqual(['correo', 'telefono', 'contrasena']);
  });

  it('omite los opcionales vacíos al enviar', () => {
    expect(construirSolicitudEspecialista(validos)).toEqual({ nombre: 'Sofía', apellido: 'Torres', correo: 's@clinica.com', contrasena: 'temporal123' });
  });
});

describe('HU-06 registrar especialidad', () => {
  it('arma la solicitud con el especialista de la sesión', () => {
    expect(construirSolicitudEspecialidad({ nombreEspecialidad: ' Cardio ', descripcion: ' x ', duracionMinutos: ' 30 ' }, 101)).toEqual({
      nombreEspecialidad: 'Cardio',
      descripcion: 'x',
      duracionMinutos: 30,
      idEspecialista: 101,
    });
  });
});

describe('HU-09 horarios', () => {
  const existentes: Horario[] = [{ idHorario: 1, fecha: '2026-10-20', horaInicio: '08:00', horaFin: '12:00', estado: 'LIBRE' }];
  const hoy = '2026-10-18';

  it('acepta un horario válido', () => {
    const valores = { fecha: '2026-10-21', horaInicio: '08:00', horaFin: '09:00' };
    expect(validarHorario(valores, existentes, hoy)).toEqual({});
    expect(construirSolicitudHorario(valores)).toEqual(valores);
  });

  it('marca campos vacíos, fecha pasada y fin anterior al inicio', () => {
    expect(validarHorario({ fecha: '', horaInicio: '', horaFin: '' }, [], hoy)).toEqual({
      fecha: expect.any(String),
      horaInicio: expect.any(String),
      horaFin: expect.any(String),
    });
    expect(validarHorario({ fecha: '2026-10-01', horaInicio: '08:00', horaFin: '09:00' }, [], hoy).fecha).toMatch(/anterior a hoy/);
    expect(validarHorario({ fecha: '2026-10-21', horaInicio: '10:00', horaFin: '09:00' }, [], hoy).horaFin).toMatch(/posterior/);
  });

  it('escenario 2: avisa del cruce con otro horario del mismo día', () => {
    expect(validarHorario({ fecha: '2026-10-20', horaInicio: '11:00', horaFin: '13:00' }, existentes, hoy).horaInicio).toMatch(/Se cruza/);
    expect(validarHorario({ fecha: '2026-10-20', horaInicio: '12:00', horaFin: '13:00' }, existentes, hoy)).toEqual({});
  });
});
