import { describe, expect, it } from 'vitest';
import type { Especialista } from '../types/especialista';
import { fechaNumerica } from '../utils/fechas';
import { validarRecuperacion, validarRestablecer } from './HU05RecuperarContrasena/validacion';
import { construirRango, validarRango } from './HU19InformeGeneral/validacion';
import {
  construirActualizacionEspecialista,
  hayCambiosEnEspecialista,
  validarEdicionEspecialista,
  valoresDesdeEspecialista,
} from './HU21EditarEspecialista/validacion';

describe('HU-05 recuperar contraseña', () => {
  it('pide un correo con formato válido', () => {
    expect(validarRecuperacion('')).toHaveProperty('correo');
    expect(validarRecuperacion('sin-arroba').correo).toMatch(/formato del correo/);
    expect(validarRecuperacion('  ana@correo.com  ')).toEqual({});
  });

  it('la nueva clave exige 8 caracteres y que las dos coincidan', () => {
    expect(validarRestablecer({ contrasena: '', confirmarContrasena: '' })).toEqual({
      contrasena: 'Crea tu nueva contraseña.',
      confirmarContrasena: 'Confirma tu nueva contraseña.',
    });
    expect(validarRestablecer({ contrasena: 'corta', confirmarContrasena: 'corta' }).contrasena).toMatch(/mínimo 8/);
    expect(validarRestablecer({ contrasena: 'claveSegura1', confirmarContrasena: 'otra' }).confirmarContrasena).toMatch(/no coinciden/);
    expect(validarRestablecer({ contrasena: 'claveSegura1', confirmarContrasena: 'claveSegura1' })).toEqual({});
  });

  it('no recorta los espacios de la clave', () => {
    expect(validarRestablecer({ contrasena: '        ', confirmarContrasena: '        ' })).toEqual({});
  });
});

describe('HU-19 rango de fechas', () => {
  it('sin fechas, con una sola o con las dos es válido', () => {
    expect(validarRango({ desde: '', hasta: '' })).toEqual({});
    expect(validarRango({ desde: '2026-09-01', hasta: '' })).toEqual({});
    expect(validarRango({ desde: '', hasta: '2026-09-30' })).toEqual({});
    expect(validarRango({ desde: '2026-09-01', hasta: '2026-09-01' })).toEqual({});
  });

  it('rechaza fechas inexistentes y rangos invertidos', () => {
    expect(validarRango({ desde: '2026-02-31', hasta: '' }).desde).toMatch(/fecha real/);
    expect(validarRango({ desde: '', hasta: 'ayer' }).hasta).toMatch(/fecha real/);
    expect(validarRango({ desde: '2026-09-30', hasta: '2026-09-01' }).hasta).toMatch(/no puede ser anterior/);
  });

  it('solo envía las fechas escritas', () => {
    expect(construirRango({ desde: '', hasta: '' })).toEqual({});
    expect(construirRango({ desde: '2026-09-01', hasta: '' })).toEqual({ desde: '2026-09-01' });
    expect(construirRango({ desde: '2026-09-01', hasta: '2026-09-30' })).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' });
  });

  it('muestra las fechas con el año', () => {
    expect(fechaNumerica('2026-09-08')).toBe('08/09/2026');
  });
});

describe('HU-21 editar especialista', () => {
  const carlos: Especialista = {
    idUsuario: 101,
    nombre: 'Carlos',
    apellido: 'Ramírez',
    correo: 'carlos@vitalis.com',
    telefono: null,
    registroMedico: null,
    especialidades: [],
  };
  const valores = valoresDesdeEspecialista(carlos);

  it('parte de los datos guardados, con vacío en lo que no tiene', () => {
    expect(valores).toEqual({ nombre: 'Carlos', apellido: 'Ramírez', correo: 'carlos@vitalis.com', telefono: '', registroMedico: '' });
    expect(validarEdicionEspecialista(valores)).toEqual({});
  });

  it('marca obligatorios vacíos y formatos incorrectos', () => {
    const errores = validarEdicionEspecialista({ ...valores, nombre: ' ', apellido: '', correo: 'x', telefono: '12' });
    expect(Object.keys(errores)).toEqual(['nombre', 'apellido', 'correo', 'telefono']);
  });

  it('detecta cambios ignorando espacios al inicio y al final', () => {
    expect(hayCambiosEnEspecialista({ ...valores, nombre: ' Carlos ' }, valores)).toBe(false);
    expect(hayCambiosEnEspecialista({ ...valores, telefono: '3001112233' }, valores)).toBe(true);
  });

  it('solo envía el teléfono y el registro médico si se escribieron', () => {
    expect(construirActualizacionEspecialista(valores)).toEqual({ nombre: 'Carlos', apellido: 'Ramírez', correo: 'carlos@vitalis.com' });
    expect(construirActualizacionEspecialista({ ...valores, telefono: ' 3001112233 ', registroMedico: 'RM-1' })).toEqual({
      nombre: 'Carlos',
      apellido: 'Ramírez',
      correo: 'carlos@vitalis.com',
      telefono: '3001112233',
      registroMedico: 'RM-1',
    });
  });
});
