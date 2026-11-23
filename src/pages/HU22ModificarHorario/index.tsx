import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { ApiError, getErrorMessage } from '../../services/api';
import { listarHorariosDeEspecialista, modificarHorario } from '../../services/horarios.service';
import type { Horario } from '../../types/horario';
import { CLASE_ESTADO_HORARIO, ETIQUETA_ESTADO_HORARIO } from '../../utils/agenda';
import { fechaCorta, hoyISO, hora12 } from '../../utils/fechas';
import { tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_HORARIO,
  construirSolicitudHorario,
  esCampoHorario,
  validarHorario,
  type CampoHorario,
  type ErroresHorario,
  type ValoresHorario,
} from '../HU09DefinirHorariosDisponibles/validacion';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';
const ACCION_TABLA =
  'text-[#1D6070] text-[13px] font-semibold underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] disabled:opacity-60 disabled:cursor-not-allowed';

const descripcionDe = (h: Horario) => `${fechaCorta(h.fecha)}, ${hora12(h.horaInicio)} a ${hora12(h.horaFin)}`;

// HU-22 — Modificar horario: PUT /api/horarios/{id}. Solo ROLE_ESPECIALISTA y solo sobre su propia
// agenda (el servidor lo comprueba). Un horario con citas futuras reservadas no se puede cambiar
// hasta que esas citas se cancelen o se reprogramen (escenario 2). El horario nuevo se ofrece de
// inmediato en la consulta de disponibilidad (HU-10).
export default function HU22ModificarHorario() {
  useTitulo('Modificar horario');

  const { sesion } = useAuth();
  const idEspecialista = sesion?.idUsuario;
  const { datos, cargando, error, recargar } = useCargaDatos(
    (signal) => (idEspecialista === undefined ? Promise.resolve([]) : listarHorariosDeEspecialista(idEspecialista, signal)),
    [idEspecialista],
  );

  const [seleccionado, setSeleccionado] = useState<Horario | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const confirmacionRef = useRef<HTMLParagraphElement>(null);
  const hoy = hoyISO();

  // Solo se pueden modificar horarios que aún no pasaron
  const ordenados = useMemo(
    () =>
      (datos ?? [])
        .filter((h) => h.fecha >= hoy)
        .sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`)),
    [datos, hoy],
  );

  // Si al recargar el horario elegido ya no existe o cambió de estado, se usa la versión nueva
  const actual = seleccionado ? (ordenados.find((h) => h.idHorario === seleccionado.idHorario) ?? null) : null;

  useEffect(() => {
    if (confirmacion) confirmacionRef.current?.focus();
  }, [confirmacion]);

  function alGuardar(modificado: Horario) {
    setSeleccionado(null);
    setConfirmacion(`Horario modificado: ${descripcionDe(modificado)}. Ya se refleja en la disponibilidad.`);
    recargar();
  }

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Modificar horario</h1>
        <p className="text-slate-500 text-sm">Ajusta tus horarios de atención según los cambios de tu agenda</p>
        <p className="text-slate-600 text-xs">
          Un horario con citas futuras reservadas no se puede modificar hasta que esas citas se cancelen o se
          reprogramen. ¿Necesitas agregar horarios nuevos?{' '}
          <Link to={RUTAS.horarios} className="text-[#1D6070] underline font-medium">
            Ir a Mi agenda
          </Link>
          .
        </p>
      </div>

      {confirmacion && (
        <p
          ref={confirmacionRef}
          tabIndex={-1}
          role="status"
          className="text-green-800 text-sm border border-green-800 rounded-lg p-3 focus:outline-none"
        >
          {confirmacion}
        </p>
      )}

      {cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Cargando tu agenda…
        </p>
      )}
      {error && (
        <div className="flex flex-col items-start gap-3 border border-red-700 rounded-lg p-4">
          <p role="alert" className="text-red-700 text-sm">
            {error}
          </p>
          <button type="button" onClick={recargar} className={BOTON_PRIMARIO}>
            Reintentar
          </button>
        </div>
      )}

      {datos && !cargando && ordenados.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-slate-100 p-6">
          <p className="text-slate-900 text-base font-medium">No tienes horarios próximos para modificar.</p>
          <Link to={RUTAS.horarios} className={BOTON_PRIMARIO}>
            Definir horarios
          </Link>
        </div>
      )}

      {ordenados.length > 0 && (
        <section aria-labelledby="horarios-modificables" className="flex flex-col gap-3">
          <h2 id="horarios-modificables" className="text-slate-900 text-base font-semibold">
            Tus próximos horarios
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-300">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Próximos horarios de tu agenda, con su estado y la acción disponible</caption>
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Horario</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((horario) => (
                  <tr
                    key={horario.idHorario}
                    className={`border-t border-slate-300 ${horario.idHorario === actual?.idHorario ? 'bg-slate-100' : ''}`}
                  >
                    <td className="px-4 py-3 text-slate-900 font-medium">{fechaCorta(horario.fecha)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {hora12(horario.horaInicio)} – {hora12(horario.horaFin)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${CLASE_ESTADO_HORARIO[horario.estado]}`}>
                      {ETIQUETA_ESTADO_HORARIO[horario.estado]}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label={`Modificar horario ${descripcionDe(horario)}`}
                        aria-pressed={horario.idHorario === actual?.idHorario}
                        onClick={() => {
                          setConfirmacion(null);
                          setSeleccionado(horario);
                        }}
                        className={ACCION_TABLA}
                      >
                        Modificar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {actual && actual.estado === 'RESERVADO' && (
        <section
          aria-labelledby="no-modificable-titulo"
          className="flex flex-col items-start gap-3 rounded-xl border border-red-700 p-6"
        >
          <h2 id="no-modificable-titulo" className="text-slate-900 text-lg font-bold">
            No se puede modificar este horario
          </h2>
          <p role="alert" className="text-slate-700 text-sm">
            El horario del {descripcionDe(actual)} tiene una cita futura reservada. Si lo cambias, el paciente perdería su
            cita. Podrás modificarlo cuando esa cita se cancele o se reprograme.
          </p>
          <button
            type="button"
            onClick={() => setSeleccionado(null)}
            className="text-[#1D6070] text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg border border-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
          >
            Entendido
          </button>
        </section>
      )}

      {actual && actual.estado !== 'RESERVADO' && (
        <FormularioModificar
          key={actual.idHorario}
          horario={actual}
          otros={ordenados.filter((h) => h.idHorario !== actual.idHorario)}
          alGuardar={alGuardar}
          alCancelar={() => setSeleccionado(null)}
          alConflicto={recargar}
        />
      )}
    </div>
  );
}

interface FormularioModificarProps {
  horario: Horario;
  /** Los demás horarios del especialista: para avisar antes de enviar si el nuevo rango se cruza */
  otros: Horario[];
  alGuardar: (modificado: Horario) => void;
  alCancelar: () => void;
  /** El servidor rechazó el cambio por un estado que la lista ya no refleja: conviene recargarla */
  alConflicto: () => void;
}

function FormularioModificar({ horario, otros, alGuardar, alCancelar, alConflicto }: FormularioModificarProps) {
  const { cerrarSesion } = useAuth();
  const inicial: ValoresHorario = { fecha: horario.fecha, horaInicio: horario.horaInicio, horaFin: horario.horaFin };
  const [valores, setValores] = useState<ValoresHorario>(inicial);
  const [errores, setErrores] = useState<ErroresHorario>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.getElementById('modificar-fecha')?.focus();
    return () => controladorRef.current?.abort();
  }, []);

  const hayCambios = CAMPOS_HORARIO.some((campo) => valores[campo] !== inicial[campo]);

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
  }

  function enfocarPrimerError(conErrores: ErroresHorario) {
    const primero = CAMPOS_HORARIO.find((campo) => conErrores[campo]);
    if (primero) document.getElementById(`modificar-${primero}`)?.focus();
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando || !hayCambios) return;
    setErrorGeneral(null);

    // Escenario 3: hora de fin anterior a la de inicio, campos vacíos o fecha inválida
    const erroresCliente = validarHorario(valores, otros);
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
      alGuardar(await modificarHorario(horario.idHorario, construirSolicitudHorario(valores), controlador.signal));
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;
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
          setEnviando(false);
          return;
        }
      }
      // 409: alguien reservó el horario mientras tanto, o el nuevo rango se cruza con otro
      if (falla instanceof ApiError && falla.status === 409) alConflicto();
      setErrorGeneral(getErrorMessage(falla));
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      aria-busy={enviando}
      aria-labelledby="modificar-titulo"
      className="flex flex-col gap-4 rounded-xl p-6 shadow-[0px_4px_16px_rgba(15,23,41,0.08)]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="modificar-titulo" className="text-slate-900 text-base font-semibold">
          Modificar horario del {descripcionDe(horario)}
        </h2>
        <p className="text-slate-600 text-xs">Los campos marcados con * son obligatorios.</p>
      </div>

      {errorGeneral && (
        <p role="alert" className="text-red-700 text-sm border border-red-700 rounded-lg p-3">
          {errorGeneral}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          id="modificar-fecha"
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
          id="modificar-horaInicio"
          label="Hora inicio"
          type="time"
          value={valores.horaInicio}
          onChange={(valor) => cambiarValor('horaInicio', valor)}
          error={errores.horaInicio}
          required
          readOnly={enviando}
        />
        <FormField
          id="modificar-horaFin"
          label="Hora fin"
          type="time"
          value={valores.horaFin}
          onChange={(valor) => cambiarValor('horaFin', valor)}
          error={errores.horaFin}
          required
          readOnly={enviando}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          aria-disabled={enviando || !hayCambios}
          className="bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 px-6 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
        >
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={alCancelar}
          disabled={enviando}
          className="text-[#1D6070] text-[15px] font-semibold leading-[normal] py-3.5 px-6 rounded-lg border border-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
