import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getErrorMessage, request } from './api';
import { cerrarSesionEnServidor, iniciarSesion, obtenerSesionActual } from './auth.service';
import { aCita } from './citas.service';
import { aEspecialidad } from './especialidades.service';
import { aHorario } from './horarios.service';
import { esRol, esSesion } from './sesion';
import { aPerfil } from './usuarios.service';

const responder = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), { status });

let fetchFalso: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchFalso = vi.fn();
  vi.stubGlobal('fetch', fetchFalso);
});
afterEach(() => vi.unstubAllGlobals());

const ultimaLlamada = () => fetchFalso.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];

describe('request (cliente HTTP)', () => {
  it('envía la cookie de sesión y no manda X-Requested-With en las lecturas', async () => {
    fetchFalso.mockResolvedValue(responder(200, { ok: true }));
    await expect(request('/api/x')).resolves.toEqual({ ok: true });
    const [ruta, opciones] = ultimaLlamada();
    expect(ruta).toBe('/api/x');
    expect(opciones.credentials).toBe('include');
    expect(opciones.headers['X-Requested-With']).toBeUndefined();
  });

  it('en las peticiones que cambian datos añade X-Requested-With y el cuerpo JSON', async () => {
    fetchFalso.mockResolvedValue(responder(201, { id: 1 }));
    await request('/api/x', { method: 'POST', body: { a: 1 } });
    const [, opciones] = ultimaLlamada();
    expect(opciones.headers['X-Requested-With']).toBe('XMLHttpRequest');
    expect(opciones.headers['Content-Type']).toBe('application/json');
    expect(opciones.body).toBe('{"a":1}');
  });

  it('204 no devuelve cuerpo', async () => {
    fetchFalso.mockResolvedValue(responder(204));
    await expect(request('/api/x', { method: 'PUT' })).resolves.toBeUndefined();
  });

  it('400 con un mapa de campos entrega errores por campo', async () => {
    fetchFalso.mockResolvedValue(responder(400, { nombre: 'Obligatorio' }));
    const error = await request('/api/x').catch((e: ApiError) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldErrors).toEqual({ nombre: 'Obligatorio' });
  });

  it('400 con un texto o con { error } entrega el mensaje', async () => {
    fetchFalso.mockResolvedValueOnce(responder(400, 'Ya existe una cuenta registrada con ese correo'));
    expect(getErrorMessage(await request('/api/x').catch((e: unknown) => e))).toBe('Ya existe una cuenta registrada con ese correo');
    fetchFalso.mockResolvedValueOnce(responder(409, { error: 'El horario ya no está disponible.' }));
    expect(getErrorMessage(await request('/api/x').catch((e: unknown) => e))).toBe('El horario ya no está disponible.');
  });

  it('401, 403 y 5xx usan mensajes fijos, sin detalles del servidor', async () => {
    fetchFalso.mockResolvedValueOnce(responder(401, 'detalle interno'));
    expect(getErrorMessage(await request('/api/x').catch((e: unknown) => e))).toMatch(/sesión no es válida/);
    fetchFalso.mockResolvedValueOnce(responder(403, 'detalle interno'));
    expect(getErrorMessage(await request('/api/x').catch((e: unknown) => e))).toMatch(/No tienes permiso/);
    fetchFalso.mockResolvedValueOnce(responder(500, 'NullPointerException en línea 3'));
    const mensaje = getErrorMessage(await request('/api/x').catch((e: unknown) => e));
    expect(mensaje).toMatch(/no está disponible por ahora/);
    expect(mensaje).not.toMatch(/NullPointer/);
  });

  it('sin conexión devuelve status 0, y una petición cancelada se deja pasar', async () => {
    fetchFalso.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const error = (await request('/api/x').catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(0);
    fetchFalso.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
    await expect(request('/api/x')).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('un error desconocido da un mensaje genérico', () => {
    expect(getErrorMessage(new Error('x'))).toMatch(/error inesperado/);
  });
});

describe('sesión', () => {
  it('reconoce roles y sesiones válidas', () => {
    expect(esRol('ROLE_ADMIN')).toBe(true);
    expect(esRol('ROLE_X')).toBe(false);
    expect(esSesion({ idUsuario: 1, nombre: 'Ana', rol: 'ROLE_USUARIO' })).toBe(true);
    expect(esSesion({ idUsuario: '1', nombre: 'Ana', rol: 'ROLE_USUARIO' })).toBe(false);
    expect(esSesion(null)).toBe(false);
  });
});

describe('auth.service', () => {
  const sesion = { idUsuario: 7, nombre: 'Marta', rol: 'ROLE_ESPECIALISTA' };

  it('inicia sesión y devuelve solo id, nombre y rol', async () => {
    fetchFalso.mockResolvedValue(responder(200, { ...sesion, token: 'no-debe-conservarse' }));
    await expect(iniciarSesion({ correo: 'a@b.co', contrasena: 'x' })).resolves.toEqual(sesion);
  });

  it('credenciales inválidas: el mismo mensaje para 400 y 401, sin revelar cuál falló', async () => {
    for (const estado of [400, 401]) {
      fetchFalso.mockResolvedValueOnce(responder(estado, estado === 400 ? 'Usuario no existe' : ''));
      await expect(iniciarSesion({ correo: 'a@b.co', contrasena: 'x' })).rejects.toThrow('Las credenciales ingresadas no son válidas.');
    }
  });

  it('HU-23: cuenta bloqueada (423 o 429) muestra el aviso de bloqueo temporal', async () => {
    for (const estado of [423, 429]) {
      fetchFalso.mockResolvedValueOnce(responder(estado, ''));
      await expect(iniciarSesion({ correo: 'a@b.co', contrasena: 'x' })).rejects.toThrow(/bloqueado temporalmente/);
    }
  });

  it('una respuesta sin rol válido se rechaza', async () => {
    fetchFalso.mockResolvedValue(responder(200, { idUsuario: 1, nombre: 'Ana', rol: 'ROLE_X' }));
    await expect(iniciarSesion({ correo: 'a@b.co', contrasena: 'x' })).rejects.toMatchObject({ status: 502 });
  });

  it('obtenerSesionActual devuelve la sesión, o null sin sesión o con una respuesta rara', async () => {
    fetchFalso.mockResolvedValueOnce(responder(200, sesion));
    await expect(obtenerSesionActual()).resolves.toEqual(sesion);
    fetchFalso.mockResolvedValueOnce(responder(401, ''));
    await expect(obtenerSesionActual()).resolves.toBeNull();
    fetchFalso.mockResolvedValueOnce(responder(200, { hola: 1 }));
    await expect(obtenerSesionActual()).resolves.toBeNull();
    fetchFalso.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(obtenerSesionActual()).resolves.toBeNull();
  });

  it('cerrar sesión llama a logout y no falla aunque el servidor no responda', async () => {
    fetchFalso.mockResolvedValueOnce(responder(204));
    await cerrarSesionEnServidor();
    expect(ultimaLlamada()[0]).toBe('/api/auth/logout');
    fetchFalso.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(cerrarSesionEnServidor()).resolves.toBeUndefined();
  });
});

describe('lectura de las respuestas del backend', () => {
  it('aHorario normaliza la hora y el estado', () => {
    expect(aHorario({ idHorario: 1, fecha: '2026-10-20T00:00:00', horaInicio: '08:00:00', horaFin: '09:00:00', estado: 'BLOQUEADO' })).toEqual({
      idHorario: 1,
      fecha: '2026-10-20',
      horaInicio: '08:00',
      horaFin: '09:00',
      estado: 'BLOQUEADO',
    });
    expect(aHorario({ idHorario: 1, fecha: '2026-10-20', horaInicio: '08:00', horaFin: '09:00', disponible: true })?.estado).toBe('LIBRE');
    expect(aHorario({ idHorario: 1, fecha: '2026-10-20', horaInicio: '08:00', horaFin: '09:00', disponible: false })?.estado).toBe('RESERVADO');
    expect(aHorario({ idHorario: 1 })).toBeNull();
    expect(aHorario('x')).toBeNull();
  });

  it('aCita lee la entidad completa del backend y descarta lo demás', () => {
    const cita = aCita({
      idCita: 3,
      usuario: { contrasenaHash: 'secreto' },
      especialista: { idUsuario: 101, nombre: 'Carlos', apellido: 'Ramírez' },
      especialidad: { idEspecialidad: 1, nombreEspecialidad: 'Cardiología', duracionMinutos: 30 },
      fechaCita: '2026-10-20',
      horaCita: '08:00:00',
      estado: 'PROGRAMADA',
    });
    expect(cita).toEqual({
      idCita: 3,
      idEspecialidad: 1,
      especialidad: 'Cardiología',
      duracionMinutos: 30,
      idEspecialista: 101,
      especialista: 'Carlos Ramírez',
      fecha: '2026-10-20',
      hora: '08:00',
      estado: 'PROGRAMADA',
    });
    expect(JSON.stringify(cita)).not.toMatch(/secreto/);
    expect(aCita({ idCita: 1 })).toBeNull();
  });

  it('aPerfil exige los campos y nunca conserva el hash', () => {
    expect(aPerfil({ idUsuario: 1, nombre: 'Ana', apellido: 'P', correo: 'a@b.co', telefono: '', contrasenaHash: 'x' })).toEqual({
      idUsuario: 1,
      nombre: 'Ana',
      apellido: 'P',
      correo: 'a@b.co',
      telefono: null,
    });
    expect(aPerfil({ idUsuario: 1 })).toBeNull();
  });

  it('aEspecialidad copia solo lo que se muestra del especialista', () => {
    const e = aEspecialidad({
      idEspecialidad: 2,
      nombreEspecialidad: 'Pediatría',
      descripcion: 'Niños',
      duracionMinutos: 20,
      especialista: { idUsuario: 5, nombre: 'Luis', apellido: 'Gil', contrasenaHash: 'x', correo: 'l@g.co' },
    });
    expect(e?.especialista).toEqual({ idUsuario: 5, nombre: 'Luis', apellido: 'Gil' });
    expect(aEspecialidad({})).toBeNull();
  });
});
