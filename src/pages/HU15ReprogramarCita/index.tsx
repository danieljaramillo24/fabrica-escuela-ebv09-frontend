import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BotonOpcion from '../../components/BotonOpcion';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { ApiError, getErrorMessage } from '../../services/api';
import { listarMisCitas, reprogramarCita } from '../../services/citas.service';
import { listarHorariosDisponibles } from '../../services/horarios.service';
import type { CitaCreada } from '../../types/cita';
import { agruparPorFecha } from '../../utils/agenda';
import { citaVigente } from '../../utils/citas';
import { fechaCorta, fechaLarga, hora12 } from '../../utils/fechas';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed';
const BOTON_SECUNDARIO =
  'text-[#1D6070] text-[15px] font-semibold leading-[normal] py-3.5 px-4 rounded-lg border border-[#1D6070] text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

// HU-15 — Reprogramar cita: PUT /api/citas/{id}/reprogramar con { idHorario }. Solo ROLE_USUARIO y
// solo el dueño de la cita. Se llega desde "Mis citas" con ?id=<idCita>. Si algo falla, la cita
// original se mantiene sin cambios (lo garantiza el servidor al hacerlo en una sola operación).
export default function HU15ReprogramarCita() {
  useTitulo('Reprogramar cita');

  const { sesion, cerrarSesion } = useAuth();
  const [parametros] = useSearchParams();
  const idCita = Number(parametros.get('id'));
  const idUsuario = sesion?.idUsuario;

  const citas = useCargaDatos(
    (signal) => (idUsuario === undefined ? Promise.reject(new ApiError(401, '')) : listarMisCitas(idUsuario, signal)),
    [idUsuario],
  );
  const cita = useMemo(() => (citas.datos ?? []).find((c) => c.idCita === idCita) ?? null, [citas.datos, idCita]);
  const puedeCambiar = cita !== null && citaVigente(cita);

  const horarios = useCargaDatos(
    (signal) =>
      cita && puedeCambiar
        ? listarHorariosDisponibles({ idEspecialidad: cita.idEspecialidad, idEspecialista: cita.idEspecialista }, signal)
        : Promise.resolve([]),
    [cita?.idCita, puedeCambiar],
  );

  const [idHorario, setIdHorario] = useState<number | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [reprogramada, setReprogramada] = useState<CitaCreada | null>(null);
  const controladorRef = useRef<AbortController | null>(null);
  const exitoRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);
  useEffect(() => {
    if (reprogramada) exitoRef.current?.focus();
  }, [reprogramada]);

  const lista = useMemo(() => (horarios.cargando ? [] : (horarios.datos ?? [])), [horarios.cargando, horarios.datos]);
  const grupos = useMemo(() => agruparPorFecha(lista), [lista]);
  const nuevo = lista.find((h) => h.idHorario === idHorario) ?? null;

  async function confirmar() {
    if (enviando || !cita) return;
    if (!nuevo) {
      setErrorGeneral('Selecciona un nuevo horario antes de confirmar.');
      return;
    }
    setErrorGeneral(null);

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEnviando(true);

    try {
      setReprogramada(await reprogramarCita(cita.idCita, { idHorario: nuevo.idHorario }, controlador.signal));
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;
      if (falla instanceof ApiError && falla.status === 401) {
        cerrarSesion();
        return;
      }
      // Escenario 2: el horario ya no está disponible. Se actualiza la lista para elegir otro.
      if (falla instanceof ApiError && falla.status === 409) {
        setIdHorario(null);
        horarios.recargar();
      }
      setErrorGeneral(getErrorMessage(falla));
    } finally {
      setEnviando(false);
    }
  }

  if (reprogramada) {
    return (
      <div className="flex flex-col items-center bg-white py-10 px-4 sm:py-16">
        <div
          ref={exitoRef}
          tabIndex={-1}
          role="status"
          className="flex flex-col items-start bg-white w-full max-w-[560px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)] focus:outline-none"
        >
          <h1 className="text-slate-900 text-2xl font-bold">¡Cita reprogramada!</h1>
          <p className="text-slate-700 text-sm">Tu cita quedó en el nuevo horario y el anterior se liberó.</p>
          <dl className="flex flex-col gap-3 self-stretch rounded-lg bg-slate-100 p-4 text-sm">
            <Dato etiqueta="Especialidad" valor={reprogramada.especialidad} />
            <Dato etiqueta="Fecha" valor={fechaLarga(reprogramada.fecha)} />
            <Dato etiqueta="Hora" valor={hora12(reprogramada.horaInicio)} />
          </dl>
          <Link to={RUTAS.misCitas} className={`self-stretch ${BOTON_PRIMARIO}`}>
            Ver mis citas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto lg:flex-row">
      <section className="flex min-w-0 flex-1 flex-col gap-6" aria-labelledby="reprogramar-titulo">
        <div className="flex flex-col gap-2">
          <h1 id="reprogramar-titulo" className="text-slate-900 text-2xl font-bold">
            Reprogramar cita
          </h1>
          <p className="text-slate-500 text-sm">Selecciona un nuevo horario disponible para tu cita</p>
        </div>

        {citas.cargando && (
          <p role="status" className="text-slate-600 text-sm">
            Cargando tu cita…
          </p>
        )}
        {citas.error && (
          <div className="flex flex-col items-start gap-3 border border-red-700 rounded-lg p-4">
            <p role="alert" className="text-red-700 text-sm">
              {citas.error}
            </p>
            <button type="button" onClick={citas.recargar} className={BOTON_PRIMARIO}>
              Reintentar
            </button>
          </div>
        )}
        {citas.datos && !citas.cargando && !cita && (
          <div className="flex flex-col items-start gap-3 rounded-lg bg-slate-100 p-6">
            <p className="text-slate-900 text-base font-medium">No encontramos esta cita entre las tuyas.</p>
            <Link to={RUTAS.misCitas} className={BOTON_PRIMARIO}>
              Ver mis citas
            </Link>
          </div>
        )}
        {cita && !puedeCambiar && (
          <div className="flex flex-col items-start gap-3 rounded-lg bg-slate-100 p-6">
            <p className="text-slate-900 text-base font-medium">Esta cita ya no admite cambios.</p>
            <p className="text-slate-700 text-sm">Una cita cancelada o que ya ocurrió no se puede reprogramar.</p>
            <Link to={RUTAS.misCitas} className={BOTON_PRIMARIO}>
              Volver a mis citas
            </Link>
          </div>
        )}

        {cita && puedeCambiar && (
          <>
            <p className="text-slate-900 text-[13px]">
              Cita actual: {cita.especialidad} · {fechaCorta(cita.fecha)} · {hora12(cita.hora)} — {cita.especialista}
            </p>

            <div className="flex flex-col gap-3">
              <h2 className="text-slate-900 text-[15px] font-semibold">Horarios disponibles</h2>
              {horarios.cargando && (
                <p role="status" className="text-slate-600 text-sm">
                  Cargando horarios…
                </p>
              )}
              {horarios.error && (
                <div className="flex flex-col items-start gap-3 border border-red-700 rounded-lg p-4">
                  <p role="alert" className="text-red-700 text-sm">
                    {horarios.error}
                  </p>
                  <button type="button" onClick={horarios.recargar} className={BOTON_PRIMARIO}>
                    Reintentar
                  </button>
                </div>
              )}
              {!horarios.cargando && !horarios.error && grupos.length === 0 && (
                <p className="text-slate-700 text-sm rounded-lg bg-slate-100 p-4">
                  No hay otros horarios disponibles para esta especialidad. Tu cita original se mantiene sin cambios.
                </p>
              )}
              {grupos.map(([fecha, delDia]) => (
                <div key={fecha} className="flex flex-col gap-2">
                  <h3 className="text-slate-700 text-sm font-medium">{fechaLarga(fecha)}</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {delDia.map((h) => (
                      <BotonOpcion
                        key={h.idHorario}
                        seleccionado={h.idHorario === idHorario}
                        onClick={() => {
                          setIdHorario(h.idHorario);
                          setErrorGeneral(null);
                        }}
                        disabled={enviando}
                      >
                        {hora12(h.horaInicio)} – {hora12(h.horaFin)}
                      </BotonOpcion>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {cita && puedeCambiar && (
        <aside
          aria-labelledby="resumen-titulo"
          className="flex h-fit w-full flex-col gap-4 rounded-xl p-7 shadow-[0px_8px_24px_rgba(15,23,41,0.08)] lg:w-[360px] lg:shrink-0"
        >
          <h2 id="resumen-titulo" className="text-slate-900 text-base font-bold">
            Resumen de reprogramación
          </h2>
          <dl className="flex flex-col gap-4">
            <Dato etiqueta="Especialidad" valor={cita.especialidad} />
            <Dato etiqueta="Especialista" valor={cita.especialista} />
            <Dato etiqueta="Nueva fecha" valor={nuevo ? fechaLarga(nuevo.fecha) : null} />
            <Dato etiqueta="Nueva hora" valor={nuevo ? `${hora12(nuevo.horaInicio)} – ${hora12(nuevo.horaFin)}` : null} />
          </dl>

          {errorGeneral && (
            <p role="alert" className="text-red-700 text-sm border border-red-700 rounded-lg p-3">
              {errorGeneral}
            </p>
          )}

          <button type="button" onClick={confirmar} aria-disabled={enviando || !nuevo} className={BOTON_PRIMARIO}>
            {enviando ? 'Confirmando…' : 'Confirmar reprogramación'}
          </button>
          <Link to={RUTAS.misCitas} className={BOTON_SECUNDARIO}>
            Volver sin cambios
          </Link>
        </aside>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-slate-600 text-xs">{etiqueta}</dt>
      <dd className={valor ? 'text-slate-900 text-[15px] font-semibold' : 'text-slate-600 text-[15px]'}>{valor || 'Por elegir'}</dd>
    </div>
  );
}
