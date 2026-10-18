import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/api';
import * as citasService from '../services/citas.service';
import * as especialidadesService from '../services/especialidades.service';
import * as horariosService from '../services/horarios.service';
import { FUTURO, poner } from '../test/ayudas';
import { SESION_USUARIO, renderConSesion } from '../test/render';
import type { Cita } from '../types/cita';
import type { Especialidad } from '../types/especialidad';
import type { Horario } from '../types/horario';
import HU10ConsultarDisponibilidad from './HU10ConsultarDisponibilidad';
import HU12SolicitarCita from './HU12SolicitarCita';
import HU13ConsultarCitas from './HU13ConsultarCitas';
import HU15ReprogramarCita from './HU15ReprogramarCita';

vi.mock('../services/citas.service');
vi.mock('../services/especialidades.service');
vi.mock('../services/horarios.service');

const cardiologia: Especialidad = {
  idEspecialidad: 1,
  nombreEspecialidad: 'Cardiología',
  descripcion: 'Corazón',
  duracionMinutos: 30,
  especialista: { idUsuario: 101, nombre: 'Carlos', apellido: 'Ramírez' },
};
const horario: Horario = { idHorario: 5, fecha: FUTURO, horaInicio: '09:00', horaFin: '10:00', estado: 'LIBRE' };
const cita = (id: number, estado = 'PROGRAMADA', fecha = FUTURO): Cita => ({
  idCita: id,
  idEspecialidad: 1,
  especialidad: 'Cardiología',
  duracionMinutos: 30,
  idEspecialista: 101,
  especialista: 'Carlos Ramírez',
  fecha,
  hora: '08:00',
  estado,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(especialidadesService.listarEspecialidades).mockResolvedValue([cardiologia]);
});

describe('HU-12 solicitar cita', () => {
  const pintar = () => renderConSesion(<HU12SolicitarCita />, { ruta: '/?especialidad=1' });

  it('pide elegir un horario antes de confirmar', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([horario]);
    pintar();
    await screen.findByRole('button', { name: /09:00 am – 10:00 am/ });
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cita' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Selecciona un horario');
    expect(citasService.solicitarCita).not.toHaveBeenCalled();
  });

  it('escenario 1: elige, confirma y muestra especialidad, fecha y hora', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([horario]);
    vi.mocked(citasService.solicitarCita).mockResolvedValue({ idCita: 9, especialidad: 'Cardiología', fecha: FUTURO, horaInicio: '09:00', estado: 'PENDIENTE' });
    pintar();
    const boton = await screen.findByRole('button', { name: /09:00 am – 10:00 am/ });
    await userEvent.click(boton);
    expect(boton).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cita' }));
    expect(await screen.findByText('¡Cita solicitada!')).toBeInTheDocument();
    expect(citasService.solicitarCita).toHaveBeenCalledWith({ idHorario: 5 }, expect.anything());
    expect(screen.getAllByText('Cardiología').length).toBeGreaterThan(0);
  });

  it('escenarios 2 y 3: si el horario ya no está libre, avisa y recarga la lista', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([horario]);
    vi.mocked(citasService.solicitarCita).mockRejectedValue(new ApiError(409, 'El horario ya no está disponible.'));
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: /09:00 am – 10:00 am/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cita' }));
    expect(await screen.findByText('El horario ya no está disponible.')).toBeInTheDocument();
    await waitFor(() => expect(horariosService.listarHorariosDisponibles).toHaveBeenCalledTimes(2));
  });

  it('sin horarios disponibles lo dice', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([]);
    pintar();
    expect(await screen.findByText(/No hay horarios disponibles para esta especialidad/)).toBeInTheDocument();
  });

  it('sin especialidad elegida invita a elegir una', async () => {
    renderConSesion(<HU12SolicitarCita />);
    expect(await screen.findByText('Elige una especialidad para ver sus horarios.')).toBeInTheDocument();
  });
});

describe('HU-13 y HU-14 mis citas y cancelar', () => {
  const pintar = () => renderConSesion(<HU13ConsultarCitas />);

  it('sin citas lo dice', async () => {
    vi.mocked(citasService.listarMisCitas).mockResolvedValue([]);
    pintar();
    expect(await screen.findByText('No tienes citas programadas.')).toBeInTheDocument();
  });

  it('lista las citas ordenadas y pide solo las del usuario de la sesión', async () => {
    vi.mocked(citasService.listarMisCitas).mockResolvedValue([cita(2, 'PROGRAMADA', '2099-07-01'), cita(1)]);
    pintar();
    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Lunes 15 jun');
    expect(citasService.listarMisCitas).toHaveBeenCalledWith(201, expect.anything());
  });

  it('HU-14 escenario 3: mantener la cita no cambia nada', async () => {
    vi.mocked(citasService.listarMisCitas).mockResolvedValue([cita(1)]);
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar cita' }));
    await userEvent.click(screen.getByRole('button', { name: 'Mantener cita' }));
    expect(citasService.cancelarCita).not.toHaveBeenCalled();
  });

  it('HU-14 escenario 1: cancelar confirma, libera y recarga la lista', async () => {
    vi.mocked(citasService.listarMisCitas).mockResolvedValue([cita(1)]);
    vi.mocked(citasService.cancelarCita).mockResolvedValue();
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar cita' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar cita' }));
    expect(await screen.findByText(/Tu cita fue cancelada/)).toBeInTheDocument();
    expect(citasService.cancelarCita).toHaveBeenCalledWith(1, expect.anything());
    await waitFor(() => expect(citasService.listarMisCitas).toHaveBeenCalledTimes(2));
  });

  it('HU-14 escenario 2: si el servidor dice que no se puede cancelar, lo muestra', async () => {
    vi.mocked(citasService.listarMisCitas).mockResolvedValue([cita(1)]);
    vi.mocked(citasService.cancelarCita).mockRejectedValue(new ApiError(409, 'Esta cita no puede cancelarse.'));
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar cita' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar cita' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('no puede cancelarse');
  });

  it('una cita cancelada o pasada ya no admite cambios', async () => {
    vi.mocked(citasService.listarMisCitas).mockResolvedValue([cita(1, 'CANCELADA')]);
    pintar();
    expect(await screen.findByText('Esta cita ya no admite cambios.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar cita' })).not.toBeInTheDocument();
  });
});

describe('HU-15 reprogramar cita', () => {
  const pintar = (id = 1) => renderConSesion(<HU15ReprogramarCita />, { ruta: `/?id=${id}` });

  beforeEach(() => vi.mocked(citasService.listarMisCitas).mockResolvedValue([cita(1)]));

  it('escenario 1: elige otro horario y confirma', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([horario]);
    vi.mocked(citasService.reprogramarCita).mockResolvedValue({ idCita: 1, especialidad: 'Cardiología', fecha: FUTURO, horaInicio: '09:00', estado: 'REPROGRAMADA' });
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: /09:00 am – 10:00 am/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reprogramación' }));
    expect(await screen.findByText('¡Cita reprogramada!')).toBeInTheDocument();
    expect(citasService.reprogramarCita).toHaveBeenCalledWith(1, { idHorario: 5 }, expect.anything());
  });

  it('pide elegir un horario antes de confirmar', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([horario]);
    pintar();
    await screen.findByRole('button', { name: /09:00 am – 10:00 am/ });
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reprogramación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Selecciona un nuevo horario');
  });

  it('escenario 2: si el horario ya no está disponible, avisa y recarga', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([horario]);
    vi.mocked(citasService.reprogramarCita).mockRejectedValue(new ApiError(409, 'El horario ya no está disponible.'));
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: /09:00 am – 10:00 am/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reprogramación' }));
    expect(await screen.findByText('El horario ya no está disponible.')).toBeInTheDocument();
    await waitFor(() => expect(horariosService.listarHorariosDisponibles).toHaveBeenCalledTimes(2));
  });

  it('escenario 3: sin otros horarios mantiene la cita original', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([]);
    pintar();
    expect(await screen.findByText(/Tu cita original se mantiene sin cambios/)).toBeInTheDocument();
  });

  it('una cita que no es del usuario no se encuentra', async () => {
    pintar(99);
    expect(await screen.findByText(/No encontramos esta cita entre las tuyas/)).toBeInTheDocument();
  });

  it('una cita cancelada no se puede reprogramar', async () => {
    vi.mocked(citasService.listarMisCitas).mockResolvedValue([cita(1, 'CANCELADA')]);
    pintar();
    expect(await screen.findByText('Esta cita ya no admite cambios.')).toBeInTheDocument();
  });
});

describe('HU-10 consultar disponibilidad', () => {
  const pintar = () => renderConSesion(<HU10ConsultarDisponibilidad />, { ruta: '/?especialidad=1' });

  it('muestra los horarios libres y enlaza a solicitar la cita', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([horario]);
    pintar();
    expect(await screen.findByText('09:00 am – 10:00 am')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Solicitar cita de Cardiología/ })).toHaveAttribute('href', '/solicitar-cita?especialidad=1');
  });

  it('escenario 3: filtra por fecha', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([horario]);
    pintar();
    await screen.findByText('09:00 am – 10:00 am');
    poner('disponibilidad-fecha', FUTURO);
    await waitFor(() => expect(horariosService.listarHorariosDisponibles).toHaveBeenLastCalledWith(expect.anything(), expect.anything(), FUTURO));
  });

  it('escenario 2: sin horarios en esa fecha lo dice', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([]);
    pintar();
    await screen.findByLabelText(/Filtrar por fecha/);
    poner('disponibilidad-fecha', FUTURO);
    expect(await screen.findByText(/No hay horarios disponibles para esa fecha/)).toBeInTheDocument();
  });

  it('una fecha pasada muestra error y no consulta', async () => {
    vi.mocked(horariosService.listarHorariosDisponibles).mockResolvedValue([]);
    pintar();
    await screen.findByText(/No hay horarios disponibles para esta especialidad/);
    const llamadas = vi.mocked(horariosService.listarHorariosDisponibles).mock.calls.length;
    poner('disponibilidad-fecha', '2020-01-01');
    expect(await screen.findByText('La fecha no puede ser anterior a hoy.')).toBeInTheDocument();
    expect(vi.mocked(horariosService.listarHorariosDisponibles).mock.calls.length).toBe(llamadas);
  });
});

describe('sesión de usuario', () => {
  it('las pantallas de citas usan el usuario de la sesión', () => {
    expect(SESION_USUARIO.idUsuario).toBe(201);
  });
});
