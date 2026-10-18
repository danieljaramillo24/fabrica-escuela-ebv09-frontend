import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/api';
import * as horarios from '../services/horarios.service';
import { FUTURO, poner } from '../test/ayudas';
import { SESION_ESPECIALISTA, renderConSesion } from '../test/render';
import type { Horario } from '../types/horario';
import HU09DefinirHorariosDisponibles from './HU09DefinirHorariosDisponibles';
import HU11BloquearHorario from './HU11BloquearHorario';

vi.mock('../services/horarios.service');

const libre: Horario = { idHorario: 1, fecha: FUTURO, horaInicio: '08:00', horaFin: '09:00', estado: 'LIBRE' };
const reservado: Horario = { idHorario: 2, fecha: FUTURO, horaInicio: '09:00', horaFin: '10:00', estado: 'RESERVADO' };
const bloqueado: Horario = { idHorario: 3, fecha: FUTURO, horaInicio: '10:00', horaFin: '11:00', estado: 'BLOQUEADO' };

beforeEach(() => vi.resetAllMocks());

describe('HU-09 definir horarios', () => {
  const pintar = () => renderConSesion(<HU09DefinirHorariosDisponibles />, { sesion: SESION_ESPECIALISTA });

  it('lista la agenda con el estado de cada horario', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre, reservado, bloqueado]);
    pintar();
    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByText('Disponible')).toBeInTheDocument();
    expect(within(tabla).getByText('Reservado')).toBeInTheDocument();
    expect(within(tabla).getByText('Bloqueado')).toBeInTheDocument();
    expect(horarios.listarHorariosDeEspecialista).toHaveBeenCalledWith(101, expect.anything());
  });

  it('con la agenda vacía lo dice', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([]);
    pintar();
    expect(await screen.findByText('Aún no has registrado horarios.')).toBeInTheDocument();
  });

  it('si no se puede cargar, ofrece reintentar', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockRejectedValueOnce(new ApiError(500, 'El servicio no está disponible por ahora.'));
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre]);
    pintar();
    expect(await screen.findByRole('alert')).toHaveTextContent('no está disponible');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('un envío vacío marca los campos y no llama al servicio', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([]);
    pintar();
    await screen.findByText('Aún no has registrado horarios.');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar horario' }));
    expect(await screen.findByText('Selecciona la fecha del horario.')).toBeInTheDocument();
    expect(horarios.crearHorario).not.toHaveBeenCalled();
  });

  it('escenario 2: avisa antes de enviar si se cruza con otro horario', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre]);
    pintar();
    await screen.findByRole('table');
    poner('horario-fecha', FUTURO);
    poner('horario-horaInicio', '08:30');
    poner('horario-horaFin', '09:30');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar horario' }));
    expect(await screen.findByText(/Se cruza con tu horario/)).toBeInTheDocument();
    expect(horarios.crearHorario).not.toHaveBeenCalled();
  });

  it('escenario 1: crea el horario, confirma y actualiza la lista', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([]);
    vi.mocked(horarios.crearHorario).mockResolvedValue({ ...libre, horaInicio: '15:00', horaFin: '16:00' });
    pintar();
    await screen.findByText('Aún no has registrado horarios.');
    poner('horario-fecha', FUTURO);
    poner('horario-horaInicio', '15:00');
    poner('horario-horaFin', '16:00');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar horario' }));
    expect(await screen.findByText(/Horario agregado/)).toBeInTheDocument();
    expect(horarios.crearHorario).toHaveBeenCalledWith({ fecha: FUTURO, horaInicio: '15:00', horaFin: '16:00' }, expect.anything());
    await waitFor(() => expect(horarios.listarHorariosDeEspecialista).toHaveBeenCalledTimes(2));
  });

  it('si el servidor detecta el conflicto lo muestra', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([]);
    vi.mocked(horarios.crearHorario).mockRejectedValue(new ApiError(409, 'Ya existe un horario que se superpone con ese rango.'));
    pintar();
    await screen.findByText('Aún no has registrado horarios.');
    poner('horario-fecha', FUTURO);
    await userEvent.click(screen.getByRole('button', { name: 'Agregar horario' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('se superpone');
  });

  it('con la sesión vencida (401) cierra la sesión', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([]);
    vi.mocked(horarios.crearHorario).mockRejectedValue(new ApiError(401, 'Tu sesión no es válida o expiró.'));
    const { contexto } = pintar();
    await screen.findByText('Aún no has registrado horarios.');
    poner('horario-fecha', FUTURO);
    await userEvent.click(screen.getByRole('button', { name: 'Agregar horario' }));
    await waitFor(() => expect(contexto.cerrarSesion).toHaveBeenCalled());
  });
});

describe('HU-11 bloquear horario', () => {
  const pintar = () => renderConSesion(<HU11BloquearHorario />, { sesion: SESION_ESPECIALISTA });

  it('un horario reservado no se puede bloquear: no tiene botón', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre, reservado, bloqueado]);
    pintar();
    await screen.findByRole('table');
    expect(screen.getByText('Con cita reservada')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Bloquear horario/ })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /Liberar horario/ })).toHaveLength(1);
  });

  it('escenario 1: bloquea con confirmación', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre]);
    vi.mocked(horarios.bloquearHorario).mockResolvedValue({ ...libre, estado: 'BLOQUEADO' });
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: /Bloquear horario/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, bloquear' }));
    expect(await screen.findByText(/Horario bloqueado/)).toBeInTheDocument();
    expect(horarios.bloquearHorario).toHaveBeenCalledWith(1, expect.anything());
  });

  it('escenario 2: si el servidor dice que hay una cita, lo muestra en el diálogo', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([libre]);
    vi.mocked(horarios.bloquearHorario).mockRejectedValue(new ApiError(409, 'Este horario tiene una cita reservada.'));
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: /Bloquear horario/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, bloquear' }));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('cita reservada');
  });

  it('escenario 3: libera un horario bloqueado', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([bloqueado]);
    vi.mocked(horarios.desbloquearHorario).mockResolvedValue({ ...bloqueado, estado: 'LIBRE' });
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: /Liberar horario/ }));
    expect(await screen.findByText(/Horario liberado/)).toBeInTheDocument();
    expect(horarios.desbloquearHorario).toHaveBeenCalledWith(3, expect.anything());
  });

  it('sin horarios invita a definirlos', async () => {
    vi.mocked(horarios.listarHorariosDeEspecialista).mockResolvedValue([]);
    pintar();
    expect(await screen.findByText('Aún no tienes horarios registrados.')).toBeInTheDocument();
  });
});
