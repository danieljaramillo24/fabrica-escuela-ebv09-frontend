import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/api';
import * as auth from '../services/auth.service';
import * as especialidadesService from '../services/especialidades.service';
import * as usuariosService from '../services/usuarios.service';
import { poner } from '../test/ayudas';
import { SESION_ADMIN, SESION_ESPECIALISTA, SESION_USUARIO, renderConSesion } from '../test/render';
import type { Especialidad } from '../types/especialidad';
import HU01RegistroDeCliente from './HU01RegistroDeCliente';
import HU02InicioDeSesion from './HU02InicioDeSesion';
import HU03GestionDePerfil from './HU03GestionDePerfil';
import HU04RegistroDeEspecialistas from './HU04RegistroDeEspecialistas';
import HU06RegistrarEspecialidad from './HU06RegistrarEspecialidad';
import HU07EditarEspecialidad from './HU07EditarEspecialidad';
import HU08ConsultarEspecialidades from './HU08ConsultarEspecialidades';

vi.mock('../services/auth.service');
vi.mock('../services/especialidades.service');
vi.mock('../services/usuarios.service');

const perfil = { idUsuario: 201, nombre: 'Ana', apellido: 'Pérez', correo: 'ana@correo.com', telefono: '3001234567' };
const propia: Especialidad = {
  idEspecialidad: 1,
  nombreEspecialidad: 'Cardiología',
  descripcion: 'Corazón',
  duracionMinutos: 30,
  especialista: { idUsuario: 101, nombre: 'Carlos', apellido: 'Ramírez' },
};
const ajena: Especialidad = { ...propia, idEspecialidad: 2, nombreEspecialidad: 'Dermatología', especialista: { idUsuario: 102, nombre: 'Laura', apellido: 'Gómez' } };

beforeEach(() => vi.resetAllMocks());

describe('HU-01 registro', () => {
  async function llenar() {
    poner('registro-nombre', 'Ana');
    poner('registro-apellido', 'Pérez');
    poner('registro-correo', 'ana@correo.com');
    poner('registro-contrasena', 'claveSegura1');
    poner('registro-confirmarContrasena', 'claveSegura1');
  }

  it('HU-25: sin aceptar el tratamiento de datos no se envía', async () => {
    renderConSesion(<HU01RegistroDeCliente />, { sesion: null });
    await llenar();
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText(/Acepta el tratamiento de tus datos/)).toBeInTheDocument();
    expect(usuariosService.registrarUsuario).not.toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('registro-autorizacion');
  });

  it('con la autorización crea la cuenta y la envía al servidor', async () => {
    vi.mocked(usuariosService.registrarUsuario).mockResolvedValue(perfil);
    renderConSesion(<HU01RegistroDeCliente />, { sesion: null });
    await llenar();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('¡Cuenta creada!')).toBeInTheDocument();
    expect(usuariosService.registrarUsuario).toHaveBeenCalledWith(expect.objectContaining({ correo: 'ana@correo.com', autorizaTratamientoDatos: true }), expect.anything());
  });

  it('correo repetido: lo marca en el campo', async () => {
    vi.mocked(usuariosService.registrarUsuario).mockRejectedValue(new ApiError(400, 'Ya existe una cuenta registrada con ese correo'));
    renderConSesion(<HU01RegistroDeCliente />, { sesion: null });
    await llenar();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText(/Ya existe una cuenta con este correo/)).toBeInTheDocument();
  });
});

describe('HU-02 inicio de sesión', () => {
  it('abre la sesión con los datos que devuelve el servidor', async () => {
    vi.mocked(auth.iniciarSesion).mockResolvedValue(SESION_USUARIO);
    const { contexto } = renderConSesion(<HU02InicioDeSesion />, { sesion: null });
    poner('login-correo', 'ana@correo.com');
    poner('login-contrasena', 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await waitFor(() => expect(contexto.iniciarSesion).toHaveBeenCalledWith(SESION_USUARIO));
  });

  it('credenciales inválidas: mensaje genérico y contraseña borrada', async () => {
    vi.mocked(auth.iniciarSesion).mockRejectedValue(new ApiError(401, 'Las credenciales ingresadas no son válidas.'));
    renderConSesion(<HU02InicioDeSesion />, { sesion: null });
    poner('login-correo', 'ana@correo.com');
    poner('login-contrasena', 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Las credenciales ingresadas no son válidas.');
    expect((document.getElementById('login-contrasena') as HTMLInputElement).value).toBe('');
  });

  it('HU-25: si la sesión se cerró por inactividad, lo avisa', () => {
    renderConSesion(<HU02InicioDeSesion />, { sesion: null, avisoSesion: 'Cerramos tu sesión por inactividad.' });
    expect(screen.getByRole('status')).toHaveTextContent('Cerramos tu sesión por inactividad.');
  });

  it('quien ya tiene sesión no ve el formulario', () => {
    renderConSesion(<HU02InicioDeSesion />, { sesion: SESION_USUARIO });
    expect(screen.queryByRole('button', { name: 'Iniciar sesión' })).not.toBeInTheDocument();
  });
});

describe('HU-03 perfil', () => {
  it('carga los datos de la sesión y los guarda', async () => {
    vi.mocked(usuariosService.obtenerPerfil).mockResolvedValue(perfil);
    vi.mocked(usuariosService.actualizarPerfil).mockResolvedValue({ ...perfil, nombre: 'Ana María' });
    const { contexto } = renderConSesion(<HU03GestionDePerfil />);
    await screen.findByDisplayValue('Ana');
    expect(usuariosService.obtenerPerfil).toHaveBeenCalledWith(201, expect.anything());
    poner('perfil-nombre', 'Ana María');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Datos actualizados correctamente.')).toBeInTheDocument();
    expect(usuariosService.actualizarPerfil).toHaveBeenCalledWith(201, expect.objectContaining({ nombre: 'Ana María' }), expect.anything());
    expect(contexto.iniciarSesion).toHaveBeenCalledWith({ ...SESION_USUARIO, nombre: 'Ana María' });
  });

  it('escenario 3: datos inválidos no se guardan', async () => {
    vi.mocked(usuariosService.obtenerPerfil).mockResolvedValue(perfil);
    renderConSesion(<HU03GestionDePerfil />);
    await screen.findByDisplayValue('Ana');
    poner('perfil-nombre', '');
    poner('perfil-telefono', '12ab');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Ingresa tu nombre.')).toBeInTheDocument();
    expect(screen.getByText(/entre 7 y 15 dígitos/, { selector: 'p[role="alert"]' })).toBeInTheDocument();
    expect(usuariosService.actualizarPerfil).not.toHaveBeenCalled();
  });

  it('cancelar descarta los cambios', async () => {
    vi.mocked(usuariosService.obtenerPerfil).mockResolvedValue(perfil);
    renderConSesion(<HU03GestionDePerfil />);
    await screen.findByDisplayValue('Ana');
    poner('perfil-apellido', 'Otro');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument();
  });

  it('si no carga ofrece reintentar', async () => {
    vi.mocked(usuariosService.obtenerPerfil).mockRejectedValue(new ApiError(500, 'El servicio no está disponible por ahora.'));
    renderConSesion(<HU03GestionDePerfil />);
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});

describe('HU-04 registro de especialistas', () => {
  async function llenar() {
    poner('especialista-nombre', 'Sofía');
    poner('especialista-apellido', 'Torres');
    poner('especialista-correo', 'sofia@clinica.com');
    poner('especialista-contrasena', 'temporal123');
  }

  it('escenario 2: datos incompletos no crean el registro', async () => {
    renderConSesion(<HU04RegistroDeEspecialistas />, { sesion: SESION_ADMIN });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar especialista' }));
    expect(await screen.findByText('Ingresa el nombre del especialista.')).toBeInTheDocument();
    expect(usuariosService.registrarEspecialista).not.toHaveBeenCalled();
  });

  it('escenario 1: registra y confirma', async () => {
    vi.mocked(usuariosService.registrarEspecialista).mockResolvedValue({ ...perfil, idUsuario: 300, nombre: 'Sofía', apellido: 'Torres', correo: 'sofia@clinica.com' });
    renderConSesion(<HU04RegistroDeEspecialistas />, { sesion: SESION_ADMIN });
    await llenar();
    await userEvent.click(screen.getByRole('button', { name: 'Registrar especialista' }));
    expect(await screen.findByText('¡Especialista registrado!')).toBeInTheDocument();
    expect(usuariosService.registrarEspecialista).toHaveBeenCalledWith(
      { nombre: 'Sofía', apellido: 'Torres', correo: 'sofia@clinica.com', contrasena: 'temporal123' },
      expect.anything(),
    );
  });

  it('escenario 3: un correo repetido se informa y no se duplica', async () => {
    vi.mocked(usuariosService.registrarEspecialista).mockRejectedValue(new ApiError(409, 'Ya existe una cuenta registrada con ese correo'));
    renderConSesion(<HU04RegistroDeEspecialistas />, { sesion: SESION_ADMIN });
    await llenar();
    await userEvent.click(screen.getByRole('button', { name: 'Registrar especialista' }));
    expect(await screen.findByText('Este especialista ya está registrado con ese correo.')).toBeInTheDocument();
  });
});

describe('HU-06 registrar especialidad', () => {
  it('toma el especialista de la sesión, no del formulario', async () => {
    vi.mocked(especialidadesService.registrarEspecialidad).mockResolvedValue(propia);
    renderConSesion(<HU06RegistrarEspecialidad />, { sesion: SESION_ESPECIALISTA });
    poner('especialidad-nombreEspecialidad', 'Cardiología');
    poner('especialidad-descripcion', 'Corazón');
    poner('especialidad-duracionMinutos', '30');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar especialidad' }));
    expect(await screen.findByText('¡Especialidad registrada!')).toBeInTheDocument();
    expect(especialidadesService.registrarEspecialidad).toHaveBeenCalledWith(
      { nombreEspecialidad: 'Cardiología', descripcion: 'Corazón', duracionMinutos: 30, idEspecialista: 101 },
      expect.anything(),
    );
  });

  it('con datos incompletos no envía', async () => {
    renderConSesion(<HU06RegistrarEspecialidad />, { sesion: SESION_ESPECIALISTA });
    await userEvent.click(screen.getByRole('button', { name: 'Guardar especialidad' }));
    expect(await screen.findByText('Ingresa el nombre de la especialidad.')).toBeInTheDocument();
    expect(especialidadesService.registrarEspecialidad).not.toHaveBeenCalled();
  });
});

describe('HU-07 editar especialidad', () => {
  const pintar = () => renderConSesion(<HU07EditarEspecialidad />, { sesion: SESION_ESPECIALISTA });

  it('solo muestra las especialidades del especialista de la sesión', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([propia, ajena]);
    pintar();
    expect(await screen.findByDisplayValue('Cardiología')).toBeInTheDocument();
    expect(screen.queryByText('Dermatología')).not.toBeInTheDocument();
  });

  it('escenario 3: cambiar la duración avisa sobre las citas ya programadas', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([propia]);
    pintar();
    await screen.findByDisplayValue('Cardiología');
    expect(screen.queryByText(/conservan su duración actual/)).not.toBeInTheDocument();
    poner('editar-duracionMinutos', '45');
    expect(await screen.findByText(/conservan su duración actual/)).toBeInTheDocument();
  });

  it('escenario 1: guarda los cambios y los confirma', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([propia]);
    vi.mocked(especialidadesService.actualizarEspecialidad).mockResolvedValue({ ...propia, duracionMinutos: 45 });
    pintar();
    await screen.findByDisplayValue('Cardiología');
    poner('editar-duracionMinutos', '45');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(/Cambios guardados/)).toBeInTheDocument();
    expect(especialidadesService.actualizarEspecialidad).toHaveBeenCalledWith(1, { nombreEspecialidad: 'Cardiología', descripcion: 'Corazón', duracionMinutos: 45 }, expect.anything());
  });

  it('escenario 2: un campo obligatorio vacío no se guarda', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([propia]);
    pintar();
    await screen.findByDisplayValue('Cardiología');
    poner('editar-nombreEspecialidad', '');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Ingresa el nombre de la especialidad.')).toBeInTheDocument();
    expect(especialidadesService.actualizarEspecialidad).not.toHaveBeenCalled();
  });

  it('sin especialidades propias invita a registrar una', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([ajena]);
    pintar();
    expect(await screen.findByText('Aún no tienes especialidades registradas.')).toBeInTheDocument();
  });
});

describe('HU-08 consultar especialidades', () => {
  it('lista, busca y ofrece solicitar cita solo a quien no es especialista', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([propia, ajena]);
    renderConSesion(<HU08ConsultarEspecialidades />);
    expect(await screen.findByText('Cardiología')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Solicitar cita de/ })).toHaveLength(2);
    await userEvent.type(screen.getByLabelText(/Buscar especialidad/), 'derma');
    expect(screen.queryByText('Cardiología')).not.toBeInTheDocument();
    expect(screen.getByText('Dermatología')).toBeInTheDocument();
  });

  it('un especialista no ve el enlace de solicitar cita', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([propia]);
    renderConSesion(<HU08ConsultarEspecialidades />, { sesion: SESION_ESPECIALISTA });
    await screen.findByText('Cardiología');
    expect(screen.queryByRole('link', { name: /Solicitar cita de/ })).not.toBeInTheDocument();
  });

  it('sin especialidades lo dice', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([]);
    renderConSesion(<HU08ConsultarEspecialidades />);
    expect(await screen.findByText('Aún no hay especialidades registradas.')).toBeInTheDocument();
  });
});
