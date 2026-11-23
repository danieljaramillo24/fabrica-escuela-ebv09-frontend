import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/api';
import * as auth from '../services/auth.service';
import * as especialidadesService from '../services/especialidades.service';
import * as especialistasService from '../services/especialistas.service';
import * as horarios from '../services/horarios.service';
import * as informes from '../services/informes.service';
import { FUTURO, poner } from '../test/ayudas';
import { SESION_ADMIN, SESION_ESPECIALISTA, SESION_USUARIO, renderConSesion } from '../test/render';
import type { Especialidad } from '../types/especialidad';
import type { Especialista } from '../types/especialista';
import type { Horario } from '../types/horario';
import HU02InicioDeSesion from './HU02InicioDeSesion';
import HU05RecuperarContrasena from './HU05RecuperarContrasena';
import HU05RestablecerContrasena from './HU05RecuperarContrasena/Restablecer';
import HU08ConsultarEspecialidades from './HU08ConsultarEspecialidades';
import HU08DetalleEspecialidad from './HU08ConsultarEspecialidades/Detalle';
import HU19InformeGeneral from './HU19InformeGeneral';
import HU20ConsultarEspecialistas from './HU20ConsultarEspecialistas';
import HU20DetalleEspecialista from './HU20ConsultarEspecialistas/Detalle';
import HU21EditarEspecialista from './HU21EditarEspecialista';
import HU22ModificarHorario from './HU22ModificarHorario';

vi.mock('../services/auth.service');
vi.mock('../services/especialidades.service');
vi.mock('../services/especialistas.service');
vi.mock('../services/horarios.service');
vi.mock('../services/informes.service');

const carlos: Especialista = {
  idUsuario: 101,
  nombre: 'Carlos',
  apellido: 'Ramírez',
  correo: 'carlos@vitalis.com',
  telefono: '3001112233',
  registroMedico: 'RM-1001',
  especialidades: [{ idEspecialidad: 1, nombreEspecialidad: 'Cardiología' }],
};
const laura: Especialista = {
  idUsuario: 102,
  nombre: 'Laura',
  apellido: 'Gómez',
  correo: 'laura@vitalis.com',
  telefono: null,
  registroMedico: null,
  especialidades: [{ idEspecialidad: 2, nombreEspecialidad: 'Dermatología' }],
};
const cardiologia: Especialidad = {
  idEspecialidad: 1,
  nombreEspecialidad: 'Cardiología',
  descripcion: 'Corazón y sistema cardiovascular',
  duracionMinutos: 30,
  especialista: { idUsuario: 101, nombre: 'Carlos', apellido: 'Ramírez' },
};
const libre: Horario = { idHorario: 1, fecha: FUTURO, horaInicio: '08:00', horaFin: '09:00', estado: 'LIBRE' };
const reservado: Horario = { idHorario: 2, fecha: FUTURO, horaInicio: '09:00', horaFin: '10:00', estado: 'RESERVADO' };

beforeEach(() => vi.resetAllMocks());

describe('HU-05 recuperar contraseña', () => {
  const pintarSolicitud = () => renderConSesion(<HU05RecuperarContrasena />, { sesion: null });

  it('con un correo mal escrito no llama al servicio', async () => {
    pintarSolicitud();
    poner('recuperar-correo', 'sin-arroba');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }));
    expect(await screen.findByText(/Revisa el formato del correo/)).toBeInTheDocument();
    expect(auth.solicitarRecuperacion).not.toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('recuperar-correo');
  });

  it('escenario 1: pide el enlace y confirma sin afirmar que la cuenta exista', async () => {
    vi.mocked(auth.solicitarRecuperacion).mockResolvedValue(undefined);
    pintarSolicitud();
    poner('recuperar-correo', 'ana@correo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }));
    expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Si .*ana@correo\.com.* está registrado/);
    expect(auth.solicitarRecuperacion).toHaveBeenCalledWith({ correo: 'ana@correo.com' }, expect.anything());
  });

  it('desde la confirmación se puede pedir otro enlace', async () => {
    vi.mocked(auth.solicitarRecuperacion).mockResolvedValue(undefined);
    pintarSolicitud();
    poner('recuperar-correo', 'ana@correo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar otro enlace' }));
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue('');
  });

  it('si el servicio falla, lo dice y permite reintentar', async () => {
    vi.mocked(auth.solicitarRecuperacion).mockRejectedValue(new ApiError(0, 'No pudimos conectar con el servidor.'));
    pintarSolicitud();
    poner('recuperar-correo', 'ana@correo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar');
    expect(screen.getByRole('button', { name: 'Enviar enlace de recuperación' })).toBeInTheDocument();
  });

  it('quien ya tiene sesión no ve el formulario', () => {
    renderConSesion(<HU05RecuperarContrasena />, { sesion: SESION_USUARIO });
    expect(screen.queryByRole('button', { name: 'Enviar enlace de recuperación' })).not.toBeInTheDocument();
  });

  describe('nueva contraseña', () => {
    const pintar = (ruta = '/restablecer-contrasena?token=abc123') =>
      renderConSesion(<HU05RestablecerContrasena />, { sesion: null, ruta });

    it('sin token en el enlace explica que no sirve y ofrece uno nuevo', () => {
      pintar('/restablecer-contrasena');
      expect(screen.getByRole('heading', { name: 'Este enlace ya no sirve' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Solicitar un enlace nuevo' })).toHaveAttribute('href', '/recuperar-contrasena');
    });

    it('exige la longitud mínima y que las dos claves coincidan', async () => {
      pintar();
      poner('restablecer-contrasena', 'corta');
      poner('restablecer-confirmarContrasena', 'otra');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));
      expect(await screen.findByText(/mínimo 8 caracteres/)).toBeInTheDocument();
      expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
      expect(auth.restablecerContrasena).not.toHaveBeenCalled();
    });

    it('escenario 3: guarda la nueva clave con el token del enlace', async () => {
      vi.mocked(auth.restablecerContrasena).mockResolvedValue(undefined);
      pintar();
      poner('restablecer-contrasena', 'claveNueva1');
      poner('restablecer-confirmarContrasena', 'claveNueva1');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));
      expect(await screen.findByRole('heading', { name: '¡Contraseña actualizada!' })).toBeInTheDocument();
      expect(auth.restablecerContrasena).toHaveBeenCalledWith(
        { token: 'abc123', contrasena: 'claveNueva1', confirmarContrasena: 'claveNueva1' },
        expect.anything(),
      );
      expect(screen.getByRole('link', { name: 'Volver al inicio de sesión' })).toHaveAttribute('href', '/login');
    });

    it('un enlace vencido o ya usado lleva a pedir otro', async () => {
      vi.mocked(auth.restablecerContrasena).mockRejectedValue(new ApiError(410, 'El enlace de recuperación ya no es válido.'));
      pintar();
      poner('restablecer-contrasena', 'claveNueva1');
      poner('restablecer-confirmarContrasena', 'claveNueva1');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));
      expect(await screen.findByRole('heading', { name: 'Este enlace ya no sirve' })).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('ya no es válido');
    });

    it('si el servidor rechaza la clave por su fortaleza, lo marca en el campo', async () => {
      vi.mocked(auth.restablecerContrasena).mockRejectedValue(new ApiError(400, 'Revisa los campos', { contrasena: 'Esa contraseña es demasiado común.' }));
      pintar();
      poner('restablecer-contrasena', 'claveNueva1');
      poner('restablecer-confirmarContrasena', 'claveNueva1');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));
      expect(await screen.findByText('Esa contraseña es demasiado común.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Guardar nueva contraseña' })).toBeInTheDocument();
    });
  });

  it('el inicio de sesión enlaza a la recuperación', () => {
    renderConSesion(<HU02InicioDeSesion />, { sesion: null });
    expect(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toHaveAttribute('href', '/recuperar-contrasena');
  });
});

describe('HU-08 detalle de especialidad', () => {
  const pintar = (ruta: string) =>
    renderConSesion(<HU08DetalleEspecialidad />, { sesion: SESION_USUARIO, ruta, patron: '/especialidades/:idEspecialidad' });

  it('escenario 3: muestra nombre, descripción, duración y especialista', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([cardiologia]);
    pintar('/especialidades/1');
    expect(await screen.findByRole('heading', { name: 'Cardiología' })).toBeInTheDocument();
    expect(screen.getByText('Corazón y sistema cardiovascular')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ramírez')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver perfil del especialista' })).toHaveAttribute('href', '/especialistas/101');
    expect(screen.getByRole('link', { name: 'Solicitar cita' })).toHaveAttribute('href', '/solicitar-cita?especialidad=1');
  });

  it('una especialidad que no existe lo dice', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([cardiologia]);
    pintar('/especialidades/99');
    expect(await screen.findByText('No encontramos esa especialidad.')).toBeInTheDocument();
  });

  it('la lista enlaza al detalle de cada especialidad', async () => {
    vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([cardiologia]);
    renderConSesion(<HU08ConsultarEspecialidades />, { sesion: SESION_USUARIO });
    expect(await screen.findByRole('link', { name: 'Ver detalle de Cardiología' })).toHaveAttribute('href', '/especialidades/1');
  });
});

describe('HU-19 informe general', () => {
  const informe = { totalPacientes: 12, totalEspecialistas: 3, citasProgramadas: 4, citasCanceladas: 2, citasRealizadas: 9 };
  const pintar = () => renderConSesion(<HU19InformeGeneral />, { sesion: SESION_ADMIN });
  const valorDe = (etiqueta: string) => screen.getByText(etiqueta).nextElementSibling;

  it('escenario 1: muestra los totales de pacientes, especialistas y citas', async () => {
    vi.mocked(informes.obtenerInformeGeneral).mockResolvedValue(informe);
    pintar();
    await screen.findByRole('heading', { name: /Resumen de todo el historial/ });
    expect(valorDe('Pacientes')).toHaveTextContent('12');
    expect(valorDe('Especialistas')).toHaveTextContent('3');
    expect(valorDe('Citas programadas')).toHaveTextContent('4');
    expect(valorDe('Citas canceladas')).toHaveTextContent('2');
    expect(valorDe('Citas realizadas')).toHaveTextContent('9');
    expect(informes.obtenerInformeGeneral).toHaveBeenCalledWith({}, expect.anything());
  });

  it('escenario 2: el rango de fechas actualiza las cifras', async () => {
    vi.mocked(informes.obtenerInformeGeneral).mockResolvedValueOnce(informe).mockResolvedValue({ ...informe, citasRealizadas: 1 });
    pintar();
    await screen.findByText('Citas realizadas');
    poner('informe-desde', '2026-09-01');
    poner('informe-hasta', '2026-09-30');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtro' }));
    await screen.findByRole('heading', { name: /del 01\/09\/2026 al 30\/09\/2026/ });
    expect(informes.obtenerInformeGeneral).toHaveBeenLastCalledWith({ desde: '2026-09-01', hasta: '2026-09-30' }, expect.anything());
    await waitFor(() => expect(valorDe('Citas realizadas')).toHaveTextContent('1'));
  });

  it('una fecha final anterior a la inicial no se envía', async () => {
    vi.mocked(informes.obtenerInformeGeneral).mockResolvedValue(informe);
    pintar();
    await screen.findByText('Citas realizadas');
    poner('informe-desde', '2026-09-30');
    poner('informe-hasta', '2026-09-01');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtro' }));
    expect(await screen.findByText(/no puede ser anterior a la fecha inicial/)).toBeInTheDocument();
    expect(informes.obtenerInformeGeneral).toHaveBeenCalledTimes(1);
  });

  it('escenario 3: sin citas en el periodo muestra ceros y un aviso', async () => {
    vi.mocked(informes.obtenerInformeGeneral).mockResolvedValue({ ...informe, citasProgramadas: 0, citasCanceladas: 0, citasRealizadas: 0 });
    pintar();
    expect(await screen.findByText(/No hay citas registradas en este periodo/)).toBeInTheDocument();
    expect(valorDe('Citas programadas')).toHaveTextContent('0');
  });

  it('si no se puede cargar, ofrece reintentar', async () => {
    vi.mocked(informes.obtenerInformeGeneral).mockRejectedValueOnce(new ApiError(500, 'El servicio no está disponible por ahora.'));
    vi.mocked(informes.obtenerInformeGeneral).mockResolvedValue(informe);
    pintar();
    expect(await screen.findByRole('alert')).toHaveTextContent('no está disponible');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Citas realizadas')).toBeInTheDocument();
  });
});

describe('HU-20 consultar especialistas', () => {
  const pintar = () => renderConSesion(<HU20ConsultarEspecialistas />, { sesion: SESION_USUARIO });

  it('escenario 1: lista nombre y especialidades, sin exponer el correo ni el teléfono', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([carlos, laura]);
    pintar();
    expect(await screen.findByRole('heading', { name: 'Carlos Ramírez' })).toBeInTheDocument();
    expect(screen.getByText('Cardiología')).toBeInTheDocument();
    expect(screen.getByText('Registro médico: RM-1001')).toBeInTheDocument();
    expect(screen.queryByText(/carlos@vitalis\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/3001112233/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver perfil de Laura Gómez' })).toHaveAttribute('href', '/especialistas/102');
  });

  it('se puede buscar por nombre o por especialidad', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([carlos, laura]);
    pintar();
    await screen.findByRole('heading', { name: 'Carlos Ramírez' });
    await userEvent.type(screen.getByLabelText(/Buscar especialista/), 'derma');
    expect(screen.queryByRole('heading', { name: 'Carlos Ramírez' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Laura Gómez' })).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(/Buscar especialista/));
    await userEvent.type(screen.getByLabelText(/Buscar especialista/), 'zzz');
    expect(screen.getByText(/Ningún especialista coincide/)).toBeInTheDocument();
  });

  it('escenario 3: sin especialistas lo informa', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([]);
    pintar();
    expect(await screen.findByText('Aún no hay especialistas registrados.')).toBeInTheDocument();
  });

  it('si falla la carga, ofrece reintentar', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockRejectedValueOnce(new ApiError(500, 'El servicio no está disponible por ahora.'));
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([carlos]);
    pintar();
    expect(await screen.findByRole('alert')).toHaveTextContent('no está disponible');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Carlos Ramírez' })).toBeInTheDocument();
  });

  describe('perfil', () => {
    const pintarPerfil = (id = 101) =>
      renderConSesion(<HU20DetalleEspecialista />, {
        sesion: SESION_USUARIO,
        ruta: `/especialistas/${id}`,
        patron: '/especialistas/:idEspecialista',
      });

    it('escenario 2: muestra el perfil, las especialidades y solo los horarios libres', async () => {
      vi.mocked(especialistasService.obtenerEspecialista).mockResolvedValue(carlos);
      vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre, reservado]);
      pintarPerfil();
      expect(await screen.findByRole('heading', { name: 'Carlos Ramírez' })).toBeInTheDocument();
      expect(especialistasService.obtenerEspecialista).toHaveBeenCalledWith(101, expect.anything());
      expect(await screen.findByText('08:00 am – 09:00 am')).toBeInTheDocument();
      expect(screen.queryByText('09:00 am – 10:00 am')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Solicitar cita de Cardiología' })).toHaveAttribute('href', '/solicitar-cita?especialidad=1');
    });

    it('sin horarios libres lo avisa', async () => {
      vi.mocked(especialistasService.obtenerEspecialista).mockResolvedValue(carlos);
      vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([reservado]);
      pintarPerfil();
      expect(await screen.findByText(/no tiene horarios disponibles por ahora/)).toBeInTheDocument();
    });

    it('si el horario no carga, el perfil se sigue viendo', async () => {
      vi.mocked(especialistasService.obtenerEspecialista).mockResolvedValue(carlos);
      vi.mocked(horarios.listarHorariosDeEspecialista).mockRejectedValue(new ApiError(403, 'No tienes permiso para realizar esta acción.'));
      pintarPerfil();
      expect(await screen.findByRole('heading', { name: 'Carlos Ramírez' })).toBeInTheDocument();
      expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso');
    });

    it('un especialista que no existe muestra el error y no rompe la pantalla', async () => {
      vi.mocked(especialistasService.obtenerEspecialista).mockRejectedValue(new ApiError(404, 'No encontramos lo que buscabas.'));
      vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([]);
      pintarPerfil(999);
      expect(await screen.findByText('No encontramos lo que buscabas.')).toBeInTheDocument();
    });
  });
});

describe('HU-21 editar especialista', () => {
  const pintar = () => renderConSesion(<HU21EditarEspecialista />, { sesion: SESION_ADMIN });

  it('muestra los datos del primer especialista y deja elegir otro', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([carlos, laura]);
    pintar();
    await screen.findByDisplayValue('carlos@vitalis.com');
    await userEvent.click(screen.getByRole('button', { name: 'Laura Gómez' }));
    expect(await screen.findByDisplayValue('laura@vitalis.com')).toBeInTheDocument();
  });

  it('sin cambios no envía nada', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([carlos]);
    pintar();
    await screen.findByDisplayValue('carlos@vitalis.com');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(especialistasService.actualizarEspecialista).not.toHaveBeenCalled();
  });

  it('escenario 1: guarda los cambios y confirma', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([carlos]);
    vi.mocked(especialistasService.actualizarEspecialista).mockResolvedValue({ ...carlos, nombre: 'Carlos Andrés' });
    pintar();
    await screen.findByDisplayValue('carlos@vitalis.com');
    poner('editar-especialista-nombre', 'Carlos Andrés');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Cambios guardados');
    expect(especialistasService.actualizarEspecialista).toHaveBeenCalledWith(
      101,
      expect.objectContaining({ nombre: 'Carlos Andrés', correo: 'carlos@vitalis.com', registroMedico: 'RM-1001' }),
      expect.anything(),
    );
  });

  it('escenario 2: campos vacíos o con mal formato no se guardan', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([carlos]);
    pintar();
    await screen.findByDisplayValue('carlos@vitalis.com');
    poner('editar-especialista-nombre', '');
    poner('editar-especialista-correo', 'sin-arroba');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Ingresa el nombre del especialista.')).toBeInTheDocument();
    expect(screen.getByText(/Revisa el formato del correo/)).toBeInTheDocument();
    expect(especialistasService.actualizarEspecialista).not.toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('editar-especialista-nombre');
  });

  it('escenario 3: un correo que ya existe se rechaza en el campo', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([carlos]);
    vi.mocked(especialistasService.actualizarEspecialista).mockRejectedValue(
      new ApiError(409, 'Ya existe una cuenta registrada con ese correo'),
    );
    pintar();
    await screen.findByDisplayValue('carlos@vitalis.com');
    poner('editar-especialista-correo', 'ana.perez@correo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(/Ese correo ya está registrado en otra cuenta/)).toBeInTheDocument();
    expect(document.activeElement?.id).toBe('editar-especialista-correo');
  });

  it('con una sesión vencida la cierra', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([carlos]);
    vi.mocked(especialistasService.actualizarEspecialista).mockRejectedValue(new ApiError(401, 'Tu sesión no es válida o expiró.'));
    const { contexto } = pintar();
    await screen.findByDisplayValue('carlos@vitalis.com');
    poner('editar-especialista-nombre', 'Otro');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(contexto.cerrarSesion).toHaveBeenCalled());
  });

  it('sin especialistas ofrece registrar uno', async () => {
    vi.mocked(especialistasService.listarEspecialistas).mockResolvedValue([]);
    pintar();
    expect(await screen.findByRole('link', { name: 'Registrar un especialista' })).toHaveAttribute('href', '/registrar-especialista');
  });
});

describe('HU-22 modificar horario', () => {
  const pintar = () => renderConSesion(<HU22ModificarHorario />, { sesion: SESION_ESPECIALISTA });
  const botonModificar = (inicio: string, fin: string) =>
    screen.findByRole('button', { name: new RegExp(`Modificar horario .*${inicio} a ${fin}`) });

  it('lista los próximos horarios con su estado', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre, reservado]);
    pintar();
    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByText('Disponible')).toBeInTheDocument();
    expect(within(tabla).getByText('Reservado')).toBeInTheDocument();
    expect(horarios.listarHorariosDeEspecialista).toHaveBeenCalledWith(101, expect.anything());
  });

  it('sin horarios próximos lo dice y lleva a definirlos', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([]);
    pintar();
    expect(await screen.findByText('No tienes horarios próximos para modificar.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Definir horarios' })).toHaveAttribute('href', '/horarios');
  });

  it('escenario 1: modifica el horario y confirma', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre]);
    vi.mocked(horarios.modificarHorario).mockResolvedValue({ ...libre, horaFin: '10:00' });
    pintar();
    await userEvent.click(await botonModificar('08:00 am', '09:00 am'));
    expect(document.activeElement?.id).toBe('modificar-fecha');
    poner('modificar-horaFin', '10:00');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(/Horario modificado/)).toBeInTheDocument();
    expect(horarios.modificarHorario).toHaveBeenCalledWith(1, { fecha: FUTURO, horaInicio: '08:00', horaFin: '10:00' }, expect.anything());
  });

  it('escenario 2: un horario con cita reservada advierte y no permite modificarlo', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre, reservado]);
    pintar();
    await userEvent.click(await botonModificar('09:00 am', '10:00 am'));
    expect(screen.getByRole('heading', { name: 'No se puede modificar este horario' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('cita futura reservada');
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument();
    expect(horarios.modificarHorario).not.toHaveBeenCalled();
  });

  it('escenario 3: una hora de fin anterior a la de inicio no se envía', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre]);
    pintar();
    await userEvent.click(await botonModificar('08:00 am', '09:00 am'));
    poner('modificar-horaFin', '07:00');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(/La hora de fin debe ser posterior/)).toBeInTheDocument();
    expect(horarios.modificarHorario).not.toHaveBeenCalled();
  });

  it('avisa antes de enviar si el nuevo rango se cruza con otro horario', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre, reservado]);
    pintar();
    await userEvent.click(await botonModificar('08:00 am', '09:00 am'));
    poner('modificar-horaFin', '09:30');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(/Se cruza con tu horario/)).toBeInTheDocument();
    expect(horarios.modificarHorario).not.toHaveBeenCalled();
  });

  it('sin cambios no envía nada, y Cancelar cierra el formulario', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre]);
    pintar();
    await userEvent.click(await botonModificar('08:00 am', '09:00 am'));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(horarios.modificarHorario).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument();
  });

  it('si alguien reservó el horario mientras tanto (409), lo avisa y recarga la agenda', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValueOnce([libre]).mockResolvedValue([{ ...libre, estado: 'RESERVADO' }]);
    vi.mocked(horarios.modificarHorario).mockRejectedValue(new ApiError(409, 'Este horario tiene citas futuras reservadas.'));
    pintar();
    await userEvent.click(await botonModificar('08:00 am', '09:00 am'));
    poner('modificar-horaFin', '10:00');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('heading', { name: 'No se puede modificar este horario' })).toBeInTheDocument();
    expect(horarios.listarHorariosDeEspecialista).toHaveBeenCalledTimes(2);
  });

  it('con una sesión vencida la cierra', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre]);
    vi.mocked(horarios.modificarHorario).mockRejectedValue(new ApiError(401, 'Tu sesión no es válida o expiró.'));
    const { contexto } = pintar();
    await userEvent.click(await botonModificar('08:00 am', '09:00 am'));
    poner('modificar-horaFin', '10:00');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(contexto.cerrarSesion).toHaveBeenCalled());
  });
});
