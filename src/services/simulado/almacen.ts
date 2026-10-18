import type { Especialidad } from '../../types/especialidad';
import type { Horario } from '../../types/horario';
import type { Perfil } from '../../types/usuario';
import type { Rol, Sesion } from '../../types/auth';

// SOLO DESARROLLO (ver services/modo.ts): estado en memoria que imita al backend mientras
// HU-02 y las historias de agenda y citas no están integradas. Se reinicia al recargar la
// página, salvo la sesión.

export const ESPECIALISTA_SIMULADO: Sesion = { idUsuario: 101, nombre: 'Carlos', rol: 'ROLE_ESPECIALISTA' };
export const USUARIO_SIMULADO: Sesion = { idUsuario: 201, nombre: 'Ana', rol: 'ROLE_USUARIO' };
export const ADMIN_SIMULADO: Sesion = { idUsuario: 1, nombre: 'Admin', rol: 'ROLE_ADMIN' };

export function sesionPorCorreo(correo: string): Sesion {
  const texto = correo.toLowerCase();
  const rol: Rol = texto.includes('admin')
    ? 'ROLE_ADMIN'
    : texto.includes('especialista')
      ? 'ROLE_ESPECIALISTA'
      : 'ROLE_USUARIO';
  return [ADMIN_SIMULADO, ESPECIALISTA_SIMULADO, USUARIO_SIMULADO].find((s) => s.rol === rol)!;
}

export const ESPECIALIDADES: Especialidad[] = [
  {
    idEspecialidad: 1,
    nombreEspecialidad: 'Cardiología',
    descripcion: 'Diagnóstico y tratamiento de enfermedades del corazón y del sistema cardiovascular.',
    duracionMinutos: 30,
    especialista: { idUsuario: 101, nombre: 'Carlos', apellido: 'Ramírez' },
  },
  {
    idEspecialidad: 2,
    nombreEspecialidad: 'Dermatología',
    descripcion: 'Cuidado y tratamiento de la piel.',
    duracionMinutos: 30,
    especialista: { idUsuario: 102, nombre: 'Laura', apellido: 'Gómez' },
  },
];

export const PERFILES: Record<number, Perfil> = {
  1: { idUsuario: 1, nombre: 'Admin', apellido: 'Vitalis', correo: 'admin@vitalis.com', telefono: null },
  101: { idUsuario: 101, nombre: 'Carlos', apellido: 'Ramírez', correo: 'especialista@vitalis.com', telefono: '3001112233' },
  201: { idUsuario: 201, nombre: 'Ana', apellido: 'Pérez', correo: 'ana.perez@correo.com', telefono: '3001234567' },
};

export interface HorarioAlmacenado extends Horario {
  idEspecialista: number;
}

export interface CitaAlmacenada {
  idCita: number;
  idHorario: number;
  idUsuario: number;
  estado: string;
}

function fechaEnDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${String(d.getDate()).padStart(2, '0')}`;
}

export const horarios: HorarioAlmacenado[] = [
  { idHorario: 1, idEspecialista: 101, fecha: fechaEnDias(1), horaInicio: '08:00', horaFin: '09:00', estado: 'RESERVADO' },
  { idHorario: 2, idEspecialista: 101, fecha: fechaEnDias(1), horaInicio: '09:00', horaFin: '10:00', estado: 'LIBRE' },
  { idHorario: 3, idEspecialista: 101, fecha: fechaEnDias(2), horaInicio: '14:00', horaFin: '15:00', estado: 'LIBRE' },
  { idHorario: 4, idEspecialista: 101, fecha: fechaEnDias(3), horaInicio: '08:00', horaFin: '12:00', estado: 'LIBRE' },
];

// Ana ya tiene una cita (la del horario 1): sirve para ver HU-13, HU-14 y HU-15 sin crearla antes
export const citas: CitaAlmacenada[] = [{ idCita: 1, idHorario: 1, idUsuario: 201, estado: 'PROGRAMADA' }];

// Se crea al primer uso (no al cargar el módulo) para que el bundler de producción pueda descartar
// todo este archivo cuando el modo simulado está apagado
let correos: Set<string> | null = null;
export function correosRegistrados(): Set<string> {
  correos ??= new Set(Object.values(PERFILES).map((p) => p.correo.toLowerCase()));
  return correos;
}

let siguienteHorario = 5;
let siguienteCita = 2;
let siguienteUsuario = 300;
export const nuevoIdHorario = () => siguienteHorario++;
export const nuevoIdCita = () => siguienteCita++;
export const nuevoIdUsuario = () => siguienteUsuario++;

/** El horario sin el dato interno del especialista dueño, tal como lo devolvería el backend */
export function aHorarioPublico({ idEspecialista: _propietario, ...horario }: HorarioAlmacenado): Horario {
  return horario;
}

/** Imita la latencia de red y respeta la cancelación de la petición */
export function demora<T>(valor: T, signal?: AbortSignal, ms = 350): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const abortar = () => rechazar(new DOMException('Aborted', 'AbortError'));
    if (signal?.aborted) return abortar();
    const temporizador = setTimeout(() => resolver(valor), ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(temporizador);
      abortar();
    });
  });
}

const CLAVE_SESION_SIMULADA = 'vitalis.simulado.sesion';

export function leerSesionSimulada(): Sesion | null {
  try {
    const bruto = sessionStorage.getItem(CLAVE_SESION_SIMULADA);
    return bruto ? (JSON.parse(bruto) as Sesion) : null;
  } catch {
    return null;
  }
}

export function guardarSesionSimulada(sesion: Sesion | null): void {
  try {
    if (sesion) sessionStorage.setItem(CLAVE_SESION_SIMULADA, JSON.stringify(sesion));
    else sessionStorage.removeItem(CLAVE_SESION_SIMULADA);
  } catch {
    // sin almacenamiento la sesión simulada dura hasta recargar
  }
}
