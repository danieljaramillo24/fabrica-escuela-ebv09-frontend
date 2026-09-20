import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { ApiError, getErrorMessage } from '../../services/api';
import { registrarEspecialidad } from '../../services/especialidades.service';
import type { Especialidad } from '../../types/especialidad';
import { tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_ESPECIALIDAD,
  MAX_DESCRIPCION,
  VALORES_INICIALES_ESPECIALIDAD,
  construirSolicitudEspecialidad,
  esCampoEspecialidad,
  validarEspecialidad,
  type CampoEspecialidad,
  type ErroresEspecialidad,
  type ValoresEspecialidad,
} from './validacion';

type Estado = 'editando' | 'enviando' | 'exito';

// HU-06 — Registrar especialidad (POST /api/especialidades). Solo para ROLE_ESPECIALISTA:
// la ruta la protege <ProtectedRoute> y el servidor vuelve a comprobarlo.
export default function HU06RegistrarEspecialidad() {
  useTitulo('Registrar especialidad');

  const { sesion, cerrarSesion } = useAuth();
  const [valores, setValores] = useState<ValoresEspecialidad>(VALORES_INICIALES_ESPECIALIDAD);
  const [errores, setErrores] = useState<ErroresEspecialidad>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>('editando');
  const [creada, setCreada] = useState<Especialidad | null>(null);

  const controladorRef = useRef<AbortController | null>(null);
  const exitoRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);
  useEffect(() => {
    if (estado === 'exito') exitoRef.current?.focus();
  }, [estado]);

  const enviando = estado === 'enviando';
  if (!sesion) return null;

  function cambiarValor(campo: CampoEspecialidad, valor: string) {
    setValores((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => {
      if (!previo[campo]) return previo;
      const siguiente = { ...previo };
      delete siguiente[campo];
      return siguiente;
    });
    setErrorGeneral(null);
  }

  function enfocarPrimerError(conErrores: ErroresEspecialidad) {
    const primero = CAMPOS_ESPECIALIDAD.find((campo) => conErrores[campo]);
    if (primero) document.getElementById(`especialidad-${primero}`)?.focus();
  }

  function registrarOtra() {
    setValores(VALORES_INICIALES_ESPECIALIDAD);
    setErrores({});
    setCreada(null);
    setEstado('editando');
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando || !sesion) return;
    setErrorGeneral(null);

    const erroresCliente = validarEspecialidad(valores);
    if (tieneErrores(erroresCliente)) {
      setErrores(erroresCliente);
      enfocarPrimerError(erroresCliente);
      return;
    }
    setErrores({});

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEstado('enviando');

    try {
      const guardada = await registrarEspecialidad(
        construirSolicitudEspecialidad(valores, sesion.idUsuario),
        sesion.token,
        controlador.signal,
      );
      setCreada(guardada);
      setEstado('exito');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;

      // Sesión vencida o inválida: se cierra y <ProtectedRoute> lleva a iniciar sesión de nuevo
      if (error instanceof ApiError && error.status === 401) {
        cerrarSesion();
        return;
      }

      setEstado('editando');
      if (error instanceof ApiError && tieneErrores(error.fieldErrors)) {
        const delServidor: ErroresEspecialidad = {};
        for (const [clave, mensaje] of Object.entries(error.fieldErrors)) {
          if (esCampoEspecialidad(clave)) delServidor[clave] = mensaje;
        }
        if (tieneErrores(delServidor)) {
          setErrores(delServidor);
          enfocarPrimerError(delServidor);
          return;
        }
      }
      setErrorGeneral(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col items-center bg-white py-10 px-4 sm:py-16">
      {estado === 'exito' && creada ? (
        <div
          ref={exitoRef}
          tabIndex={-1}
          role="status"
          className="flex flex-col items-start bg-white w-full max-w-[560px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)] focus:outline-none"
        >
          <h1 className="text-slate-900 text-2xl font-bold">¡Especialidad registrada!</h1>
          <p className="text-slate-700 text-sm">Ya está disponible para que los pacientes la seleccionen al solicitar una cita.</p>
          <dl className="flex flex-col gap-3 self-stretch rounded-lg bg-slate-100 p-4 text-sm">
            <div>
              <dt className="text-slate-600 text-xs">Nombre</dt>
              <dd className="text-slate-900 font-medium">{creada.nombreEspecialidad}</dd>
            </div>
            <div>
              <dt className="text-slate-600 text-xs">Descripción</dt>
              <dd className="text-slate-900">{creada.descripcion}</dd>
            </div>
            <div>
              <dt className="text-slate-600 text-xs">Duración</dt>
              <dd className="text-slate-900">{creada.duracionMinutos} minutos</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-4 self-stretch">
            <button
              type="button"
              onClick={registrarOtra}
              className="flex-1 bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
            >
              Registrar otra especialidad
            </button>
            <Link
              to={RUTAS.especialidades}
              className="flex-1 text-center text-[#1D6070] text-[15px] font-semibold leading-[normal] py-3.5 px-4 rounded-lg border border-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
            >
              Ver especialidades
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={manejarEnvio}
          noValidate
          aria-busy={enviando}
          aria-labelledby="especialidad-titulo"
          className="flex flex-col items-start bg-white w-full max-w-[560px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
        >
          <div className="flex flex-col gap-2">
            <h1 id="especialidad-titulo" className="text-slate-900 text-2xl font-bold">
              Registrar especialidad
            </h1>
            <p className="text-slate-500 text-sm">Define un tipo de consulta que los pacientes podrán seleccionar</p>
            <p className="text-slate-600 text-xs">Los campos marcados con * son obligatorios.</p>
          </div>

          {errorGeneral && (
            <p role="alert" className="self-stretch text-red-700 text-sm border border-red-700 rounded-lg p-3">
              {errorGeneral}
            </p>
          )}

          <FormField
            id="especialidad-nombreEspecialidad"
            label="Nombre de la especialidad"
            value={valores.nombreEspecialidad}
            onChange={(valor) => cambiarValor('nombreEspecialidad', valor)}
            error={errores.nombreEspecialidad}
            placeholder="Ej. Cardiología"
            required
            readOnly={enviando}
          />
          <FormField
            id="especialidad-descripcion"
            label="Descripción"
            multiline
            rows={4}
            value={valores.descripcion}
            onChange={(valor) => cambiarValor('descripcion', valor)}
            error={errores.descripcion}
            hint={`Hasta ${MAX_DESCRIPCION} caracteres.`}
            placeholder="Describe brevemente en qué consiste esta consulta"
            required
            readOnly={enviando}
          />
          <FormField
            id="especialidad-duracionMinutos"
            label="Duración de la consulta (minutos)"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={valores.duracionMinutos}
            onChange={(valor) => cambiarValor('duracionMinutos', valor)}
            error={errores.duracionMinutos}
            placeholder="Ej. 30"
            required
            readOnly={enviando}
          />

          <button
            type="submit"
            aria-disabled={enviando}
            className="self-stretch bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          >
            {enviando ? 'Guardando…' : 'Guardar especialidad'}
          </button>
        </form>
      )}
    </div>
  );
}
