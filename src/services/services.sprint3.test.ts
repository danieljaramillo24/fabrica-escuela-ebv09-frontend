import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import { restablecerContrasena, solicitarRecuperacion } from './auth.service';
import { actualizarEspecialista, aEspecialista, listarEspecialistas, obtenerEspecialista } from './especialistas.service';
import { modificarHorario } from './horarios.service';
import { aInforme, obtenerInformeGeneral } from './informes.service';

const responder = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), { status });

let fetchFalso: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchFalso = vi.fn();
  vi.stubGlobal('fetch', fetchFalso);
});
afterEach(() => vi.unstubAllGlobals());

const ultimaLlamada = () => fetchFalso.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];

describe('HU-05 recuperación de contraseña', () => {
  it('solicitar: envía el correo por POST', async () => {
    fetchFalso.mockResolvedValue(responder(202));
    await expect(solicitarRecuperacion({ correo: 'ana@correo.com' })).resolves.toBeUndefined();
    const [ruta, opciones] = ultimaLlamada();
    expect(ruta).toBe('/api/auth/recuperar-contrasena');
    expect(opciones.method).toBe('POST');
    expect(opciones.body).toBe('{"correo":"ana@correo.com"}');
  });

  it('solicitar: un 404 se trata como enviado, para no revelar qué correos existen', async () => {
    fetchFalso.mockResolvedValue(responder(404, 'No existe'));
    await expect(solicitarRecuperacion({ correo: 'nadie@correo.com' })).resolves.toBeUndefined();
  });

  it('solicitar: demasiadas solicitudes y errores del servidor sí se informan', async () => {
    fetchFalso.mockResolvedValueOnce(responder(429, ''));
    await expect(solicitarRecuperacion({ correo: 'ana@correo.com' })).rejects.toMatchObject({ status: 429, message: expect.stringMatching(/Espera unos minutos/) });
    fetchFalso.mockResolvedValueOnce(responder(500, ''));
    await expect(solicitarRecuperacion({ correo: 'ana@correo.com' })).rejects.toMatchObject({ status: 500 });
  });

  const datos = { token: 'abc', contrasena: 'claveNueva1', confirmarContrasena: 'claveNueva1' };

  it('restablecer: envía el token y las claves por POST', async () => {
    fetchFalso.mockResolvedValue(responder(204));
    await expect(restablecerContrasena(datos)).resolves.toBeUndefined();
    const [ruta, opciones] = ultimaLlamada();
    expect(ruta).toBe('/api/auth/restablecer-contrasena');
    expect(JSON.parse(String(opciones.body))).toEqual(datos);
  });

  it('restablecer: enlace expirado, usado o inexistente → 410 con un mismo mensaje', async () => {
    for (const respuesta of [responder(410, ''), responder(404, ''), responder(400, 'Token expirado')]) {
      fetchFalso.mockResolvedValueOnce(respuesta);
      await expect(restablecerContrasena(datos)).rejects.toMatchObject({ status: 410, message: expect.stringMatching(/ya no es válido/) });
    }
  });

  it('restablecer: una clave rechazada por el servidor conserva el error del campo', async () => {
    fetchFalso.mockResolvedValue(responder(400, { contrasena: 'Es demasiado común.' }));
    const error = await restablecerContrasena(datos).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).fieldErrors).toEqual({ contrasena: 'Es demasiado común.' });
  });
});

describe('HU-20 y HU-21 especialistas', () => {
  const crudo = {
    idUsuario: 101,
    nombre: 'Carlos',
    apellido: 'Ramírez',
    correo: 'carlos@vitalis.com',
    telefono: '3001112233',
    registroMedico: 'RM-1001',
    contrasena: 'hash-que-no-debe-llegar',
    especialidades: [{ idEspecialidad: 1, nombreEspecialidad: 'Cardiología' }, { nombreEspecialidad: 'sin id' }, 'texto'],
  };

  it('aEspecialista copia solo lo que se muestra y descarta especialidades incompletas', () => {
    const especialista = aEspecialista(crudo);
    expect(especialista).toEqual({
      idUsuario: 101,
      nombre: 'Carlos',
      apellido: 'Ramírez',
      correo: 'carlos@vitalis.com',
      telefono: '3001112233',
      registroMedico: 'RM-1001',
      especialidades: [{ idEspecialidad: 1, nombreEspecialidad: 'Cardiología' }],
    });
    expect(JSON.stringify(especialista)).not.toContain('hash');
  });

  it('aEspecialista rechaza respuestas sin los datos mínimos', () => {
    expect(aEspecialista(null)).toBeNull();
    expect(aEspecialista({ nombre: 'Sin id', correo: 'a@b.co' })).toBeNull();
    expect(aEspecialista({ idUsuario: 1, nombre: 'Sin correo' })).toBeNull();
    expect(aEspecialista({ idUsuario: 1, nombre: 'Ana', correo: 'a@b.co' })).toMatchObject({ apellido: '', telefono: null, especialidades: [] });
  });

  it('listar: GET /api/especialistas y descarta los registros inválidos', async () => {
    fetchFalso.mockResolvedValue(responder(200, [crudo, { roto: true }]));
    await expect(listarEspecialistas()).resolves.toHaveLength(1);
    expect(ultimaLlamada()[0]).toBe('/api/especialistas');
  });

  it('listar: una respuesta que no es una lista es un error', async () => {
    fetchFalso.mockResolvedValue(responder(200, { no: 'lista' }));
    await expect(listarEspecialistas()).rejects.toMatchObject({ status: 502 });
  });

  it('obtener: GET /api/especialistas/{id}', async () => {
    fetchFalso.mockResolvedValue(responder(200, crudo));
    await expect(obtenerEspecialista(101)).resolves.toMatchObject({ idUsuario: 101 });
    expect(ultimaLlamada()[0]).toBe('/api/especialistas/101');
  });

  it('actualizar: PUT /api/especialistas/{id} con los datos', async () => {
    fetchFalso.mockResolvedValue(responder(200, crudo));
    const data = { nombre: 'Carlos', apellido: 'Ramírez', correo: 'carlos@vitalis.com' };
    await expect(actualizarEspecialista(101, data)).resolves.toMatchObject({ idUsuario: 101 });
    const [ruta, opciones] = ultimaLlamada();
    expect(ruta).toBe('/api/especialistas/101');
    expect(opciones.method).toBe('PUT');
    expect(JSON.parse(String(opciones.body))).toEqual(data);
  });

  it('actualizar: conserva el 409 del correo duplicado y los errores por campo', async () => {
    const data = { nombre: 'Carlos', apellido: 'Ramírez', correo: 'otro@vitalis.com' };
    fetchFalso.mockResolvedValueOnce(responder(409, 'Ya existe una cuenta registrada con ese correo'));
    await expect(actualizarEspecialista(101, data)).rejects.toMatchObject({ status: 409 });
    fetchFalso.mockResolvedValueOnce(responder(400, { correo: 'Correo inválido' }));
    await expect(actualizarEspecialista(101, data)).rejects.toMatchObject({ fieldErrors: { correo: 'Correo inválido' } });
  });
});

describe('HU-19 informe general', () => {
  const informe = { totalPacientes: 12, totalEspecialistas: 3, citasProgramadas: 4, citasCanceladas: 2, citasRealizadas: 9 };

  it('aInforme solo acepta totales numéricos y no negativos', () => {
    expect(aInforme(informe)).toEqual(informe);
    expect(aInforme({ ...informe, citasCanceladas: -1 })).toBeNull();
    expect(aInforme({ ...informe, citasRealizadas: '9' })).toBeNull();
    expect(aInforme({ totalPacientes: 1 })).toBeNull();
    expect(aInforme(null)).toBeNull();
  });

  it('sin fechas pide todo el historial', async () => {
    fetchFalso.mockResolvedValue(responder(200, informe));
    await expect(obtenerInformeGeneral()).resolves.toEqual(informe);
    expect(ultimaLlamada()[0]).toBe('/api/informes/general');
  });

  it('con fechas las envía como parámetros', async () => {
    fetchFalso.mockResolvedValue(responder(200, informe));
    await obtenerInformeGeneral({ desde: '2026-09-01', hasta: '2026-09-30' });
    expect(ultimaLlamada()[0]).toBe('/api/informes/general?desde=2026-09-01&hasta=2026-09-30');
  });

  it('un 403 (no es administrador) y una respuesta rara se informan', async () => {
    fetchFalso.mockResolvedValueOnce(responder(403, ''));
    await expect(obtenerInformeGeneral()).rejects.toMatchObject({ status: 403 });
    fetchFalso.mockResolvedValueOnce(responder(200, { raro: true }));
    await expect(obtenerInformeGeneral()).rejects.toMatchObject({ status: 502 });
  });
});

describe('HU-22 modificar horario', () => {
  const cambios = { fecha: '2099-06-15', horaInicio: '08:00', horaFin: '10:00' };

  it('PUT /api/horarios/{id} y devuelve el horario actualizado', async () => {
    fetchFalso.mockResolvedValue(responder(200, { idHorario: 1, ...cambios, estado: 'LIBRE' }));
    await expect(modificarHorario(1, cambios)).resolves.toEqual({ idHorario: 1, ...cambios, estado: 'LIBRE' });
    const [ruta, opciones] = ultimaLlamada();
    expect(ruta).toBe('/api/horarios/1');
    expect(opciones.method).toBe('PUT');
    expect(JSON.parse(String(opciones.body))).toEqual(cambios);
  });

  it('conserva el 409 (citas reservadas o cruce) y el 403 (no es su horario)', async () => {
    fetchFalso.mockResolvedValueOnce(responder(409, 'Tiene citas futuras'));
    await expect(modificarHorario(1, cambios)).rejects.toMatchObject({ status: 409, message: 'Tiene citas futuras' });
    fetchFalso.mockResolvedValueOnce(responder(403, ''));
    await expect(modificarHorario(1, cambios)).rejects.toMatchObject({ status: 403 });
  });

  it('una respuesta sin horario válido es un error', async () => {
    fetchFalso.mockResolvedValue(responder(200, { ok: true }));
    await expect(modificarHorario(1, cambios)).rejects.toMatchObject({ status: 502 });
  });
});
