import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { ApiError, getErrorMessage } from '../../services/api';
import { crearHorario, listarHorariosDeEspecialista } from '../../services/horarios.service';
import { CLASE_ESTADO_HORARIO, ETIQUETA_ESTADO_HORARIO } from '../../utils/agenda';
import { fechaCorta, hoyISO, hora12 } from '../../utils/fechas';
import { tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_HORARIO,
  VALORES_INICIALES_HORARIO,
  construirSolicitudHorario,
  esCampoHorario,
  validarHorario,
  type CampoHorario,
  type ErroresHorario,
  type ValoresHorario,
} from './validacion';

// HU-09 — Definir horarios disponibles ("Mi agenda"): POST /api/horarios y
// GET /api/horarios/especialista/{id}. Solo para ROLE_ESPECIALISTA: la ruta la protege
// <ProtectedRoute> y el servidor vuelve a comprobarlo. La cabecera y el <main> los pone <Layout>.
export default function HU09DefinirHorariosDisponibles() {
  useTitulo('Mi agenda');

  const { sesion, cerrarSesion } = useAuth();
  const idEspecialista = sesion?.idUsuario;
  const { datos, cargando, error, recargar } = useCargaDatos(
    (signal) => (idEspecialista === undefined ? Promise.resolve([]) : listarHorariosDeEspecialista(idEspecialista, signal)),
    [idEspecialista],
  );

  const [valores, setValores] = useState<ValoresHorario>(VALORES_INICIALES_HORARIO);
  const [errores, setErrores] = useState<ErroresHorario>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);

  const ordenados = useMemo(
    () => [...(datos ?? [])].sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`)),
    [datos],
  );

  function cambiarValor(campo: CampoHorario, valor: string) {
    setValores((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => {
      // Un cambio de hora puede resolver o provocar el cruce, así que se revalidan juntas
      const limpiar = campo === 'fecha' ? CAMPOS_HORARIO : (['horaInicio', 'horaFin'] as CampoHorario[]);
      if (!limpiar.some((c) => previo[c])) return previo;
      const siguiente = { ...previo };
      for (const c of limpiar) delete siguiente[c];
      return siguiente;
    });
    setErrorGeneral(null);
    setConfirmacion(null);
  }

  function enfocarPrimerError(conErrores: ErroresHorario) {
    const primero = CAMPOS_HORARIO.find((campo) => conErrores[campo]);
    if (primero) document.getElementById(`horario-${primero}`)?.focus();
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setErrorGeneral(null);
    setConfirmacion(null);

    const erroresCliente = validarHorario(valores, datos ?? []);
    if (tieneErrores(erroresCliente)) {
      setErrores(erroresCliente);
      enfocarPrimerError(erroresCliente);
      return;
    }
    setErrores({});

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEnviando(true);

    try {
      const creado = await crearHorario(construirSolicitudHorario(valores), controlador.signal);
      setConfirmacion(`Horario agregado: ${fechaCorta(creado.fecha)}, de ${hora12(creado.horaInicio)} a ${hora12(creado.horaFin)}.`);
      setValores((previo) => ({ ...previo, fecha: '' }));
      recargar();
      document.getElementById('horario-fecha')?.focus();
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;

      // Sesión vencida o inválida: se cierra y <ProtectedRoute> lleva a iniciar sesión de nuevo
      if (falla instanceof ApiError && falla.status === 401) {
        cerrarSesion();
        return;
      }

      if (falla instanceof ApiError && tieneErrores(falla.fieldErrors)) {
        const delServidor: ErroresHorario = {};
        for (const [clave, mensaje] of Object.entries(falla.fieldErrors)) {
          if (esCampoHorario(clave)) delServidor[clave] = mensaje;
        }
        if (tieneErrores(delServidor)) {
          setErrores(delServidor);
          enfocarPrimerError(delServidor);
          return;
        }
      }
      setErrorGeneral(getErrorMessage(falla));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Mi agenda</h1>
        <p className="text-slate-500 text-sm">Define tus horarios disponibles para organizar tu agenda de consultas</p>
        <p className="text-slate-600 text-xs">
          Cada horario que registres se ofrece a los pacientes como una cita. Los campos marcados con * son obligatorios.
        </p>
      </div>

      <form
        onSubmit={manejarEnvio}
        noValidate
        aria-busy={enviando}
        aria-labelledby="horario-titulo"
        className="flex flex-col gap-4 rounded-xl p-6 shadow-[0px_4px_16px_rgba(15,23,41,0.08)]"
      >
        <h2 id="horario-titulo" className="text-slate-900 text-base font-semibold">
          Agregar horario
        </h2>

        {errorGeneral && (
          <p role="alert" className="text-red-700 text-sm border border-red-700 rounded-lg p-3">
            {errorGeneral}
          </p>
        )}
        {confirmacion && (
          <p role="status" className="text-green-800 text-sm border border-green-800 rounded-lg p-3">
            {confirmacion}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="horario-fecha"
            label="Fecha"
            type="date"
            min={hoyISO()}
            value={valores.fecha}
            onChange={(valor) => cambiarValor('fecha', valor)}
            error={errores.fecha}
            required
            readOnly={enviando}
          />
          <FormField
            id="horario-horaInicio"
            label="Hora inicio"
            type="time"
            value={valores.horaInicio}
            onChange={(valor) => cambiarValor('horaInicio', valor)}
            error={errores.horaInicio}
            required
            readOnly={enviando}
          />
          <FormField
            id="horario-horaFin"
            label="Hora fin"
            type="time"
            value={valores.horaFin}
            onChange={(valor) => cambiarValor('horaFin', valor)}
            error={errores.horaFin}
            required
            readOnly={enviando}
          />
        </div>

        <button
          type="submit"
          aria-disabled={enviando}
          className="self-start bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 px-6 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
        >
          {enviando ? 'Guardando…' : 'Agregar horario'}
        </button>
      </form>

      <section aria-labelledby="horarios-registrados" className="flex flex-col gap-3">
        <h2 id="horarios-registrados" className="text-slate-900 text-base font-semibold">
          Horarios registrados
        </h2>

        {cargando && (
          <p role="status" className="text-slate-600 text-sm">
            Cargando tus horarios…
          </p>
        )}

        {error && (
          <div className="flex flex-col items-start gap-3 border border-red-700 rounded-lg p-4">
            <p role="alert" className="text-red-700 text-sm">
              {error}
            </p>
            <button
              type="button"
              onClick={recargar}
              className="bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
            >
              Reintentar
            </button>
          </div>
        )}

        {datos && ordenados.length === 0 && (
          <div className="flex flex-col items-start gap-2 rounded-lg bg-slate-100 p-6">
            <p className="text-slate-900 text-base font-medium">Aún no has registrado horarios.</p>
            <p className="text-slate-700 text-sm">Agrega el primero con el formulario de arriba para que los pacientes puedan reservar.</p>
          </div>
        )}

        {ordenados.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-300">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Horarios registrados, ordenados por fecha</caption>
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Horario</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((horario) => (
                  <tr key={horario.idHorario} className="border-t border-slate-300">
                    <td className="px-4 py-3 text-slate-900 font-medium">{fechaCorta(horario.fecha)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {hora12(horario.horaInicio)} – {hora12(horario.horaFin)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${CLASE_ESTADO_HORARIO[horario.estado]}`}>
                      {ETIQUETA_ESTADO_HORARIO[horario.estado]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
