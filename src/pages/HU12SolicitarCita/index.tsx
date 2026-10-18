import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BotonOpcion from '../../components/BotonOpcion';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { ApiError, getErrorMessage } from '../../services/api';
import { solicitarCita } from '../../services/citas.service';
import { listarEspecialidades } from '../../services/especialidades.service';
import { listarHorariosDisponibles } from '../../services/horarios.service';
import type { CitaCreada } from '../../types/cita';
import { agruparPorFecha } from '../../utils/agenda';
import { fechaLarga, hora12 } from '../../utils/fechas';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed';

// HU-12 — Solicitar cita: GET /api/horarios/disponibles y POST /api/citas. Solo para ROLE_USUARIO:
// la ruta la protege <ProtectedRoute> y el servidor vuelve a comprobarlo. Se puede llegar con
// ?especialidad=<id> desde la lista de especialidades (HU-08).
export default function HU12SolicitarCita() {
  useTitulo('Solicitar cita');

  const { cerrarSesion } = useAuth();
  const [parametros, setParametros] = useSearchParams();
  const idElegido = Number(parametros.get('especialidad'));

  const especialidades = useCargaDatos(listarEspecialidades);
  const especialidad = useMemo(
    () => (especialidades.datos ?? []).find((e) => e.idEspecialidad === idElegido) ?? null,
    [especialidades.datos, idElegido],
  );

  const horarios = useCargaDatos(
    (signal) => (especialidad ? listarHorariosDisponibles(
          { idEspecialidad: especialidad.idEspecialidad, idEspecialista: especialidad.especialista?.idUsuario ?? null },
          signal,
        ) : Promise.resolve([])),
    [especialidad?.idEspecialidad],
  );

  const [idHorario, setIdHorario] = useState<number | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmada, setConfirmada] = useState<CitaCreada | null>(null);
  const controladorRef = useRef<AbortController | null>(null);
  const exitoRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);
  useEffect(() => {
    if (confirmada) exitoRef.current?.focus();
  }, [confirmada]);

  const lista = useMemo(() => (horarios.cargando ? [] : (horarios.datos ?? [])), [horarios.cargando, horarios.datos]);
  const grupos = useMemo(() => agruparPorFecha(lista), [lista]);
  const horario = lista.find((h) => h.idHorario === idHorario) ?? null;

  function elegirEspecialidad(id: number) {
    setParametros({ especialidad: String(id) }, { replace: true });
    setIdHorario(null);
    setErrorGeneral(null);
  }

  async function confirmar() {
    if (enviando) return;
    if (!horario) {
      setErrorGeneral('Selecciona un horario antes de confirmar tu cita.');
      return;
    }
    setErrorGeneral(null);

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEnviando(true);

    try {
      setConfirmada(await solicitarCita({ idHorario: horario.idHorario }, controlador.signal));
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;

      // Sesión vencida o inválida: se cierra y <ProtectedRoute> lleva a iniciar sesión de nuevo
      if (falla instanceof ApiError && falla.status === 401) {
        cerrarSesion();
        return;
      }

      // Escenarios 2 y 3: el horario ya no está disponible o la cita ya existe. Se actualiza la
      // lista para que la persona elija otro.
      if (falla instanceof ApiError && falla.status === 409) {
        setIdHorario(null);
        horarios.recargar();
      }
      setErrorGeneral(getErrorMessage(falla));
    } finally {
      setEnviando(false);
    }
  }

  function solicitarOtra() {
    setConfirmada(null);
    setIdHorario(null);
    horarios.recargar();
  }

  if (confirmada) {
    return (
      <div className="flex flex-col items-center bg-white py-10 px-4 sm:py-16">
        <div
          ref={exitoRef}
          tabIndex={-1}
          role="status"
          className="flex flex-col items-start bg-white w-full max-w-[560px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)] focus:outline-none"
        >
          <h1 className="text-slate-900 text-2xl font-bold">¡Cita solicitada!</h1>
          <p className="text-slate-700 text-sm">Registramos tu cita. Estos son los datos:</p>
          <dl className="flex flex-col gap-3 self-stretch rounded-lg bg-slate-100 p-4 text-sm">
            <div>
              <dt className="text-slate-600 text-xs">Especialidad</dt>
              <dd className="text-slate-900 font-medium">{confirmada.especialidad}</dd>
            </div>
            <div>
              <dt className="text-slate-600 text-xs">Fecha</dt>
              <dd className="text-slate-900 font-medium">{fechaLarga(confirmada.fecha)}</dd>
            </div>
            <div>
              <dt className="text-slate-600 text-xs">Hora</dt>
              <dd className="text-slate-900 font-medium">{hora12(confirmada.horaInicio)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-4 self-stretch">
            <button type="button" onClick={solicitarOtra} className={`flex-1 ${BOTON_PRIMARIO}`}>
              Solicitar otra cita
            </button>
            <Link
              to={RUTAS.especialidades}
              className="flex-1 text-center text-[#1D6070] text-[15px] font-semibold leading-[normal] py-3.5 px-4 rounded-lg border border-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
            >
              Ver especialidades
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto lg:flex-row">
      <section className="flex min-w-0 flex-1 flex-col gap-6" aria-labelledby="cita-titulo">
        <div className="flex flex-col gap-2">
          <h1 id="cita-titulo" className="text-slate-900 text-2xl font-bold">
            Solicitar cita
          </h1>
          <p className="text-slate-500 text-sm">Selecciona la especialidad y un horario disponible</p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-slate-900 text-sm font-bold">Especialidad</h2>

          {especialidades.cargando && (
            <p role="status" className="text-slate-600 text-sm">
              Cargando especialidades…
            </p>
          )}
          {especialidades.error && (
            <div className="flex flex-col items-start gap-3 border border-red-700 rounded-lg p-4">
              <p role="alert" className="text-red-700 text-sm">
                {especialidades.error}
              </p>
              <button type="button" onClick={especialidades.recargar} className={BOTON_PRIMARIO}>
                Reintentar
              </button>
            </div>
          )}
          {especialidades.datos && especialidades.datos.length === 0 && (
            <p className="text-slate-700 text-sm rounded-lg bg-slate-100 p-4">
              Aún no hay especialidades registradas. Vuelve a revisar más tarde.
            </p>
          )}
          {especialidades.datos && especialidades.datos.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {especialidades.datos.map((e) => (
                <BotonOpcion
                  key={e.idEspecialidad}
                  seleccionado={e.idEspecialidad === especialidad?.idEspecialidad}
                  onClick={() => elegirEspecialidad(e.idEspecialidad)}
                  disabled={enviando}
                >
                  {e.nombreEspecialidad}
                </BotonOpcion>
              ))}
            </div>
          )}
        </div>

        {especialidad && (
          <div className="flex flex-col gap-3">
            <h2 className="text-slate-900 text-sm font-bold">Horarios disponibles — {especialidad.nombreEspecialidad}</h2>

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
                No hay horarios disponibles para esta especialidad por ahora. Prueba con otra o vuelve más tarde.
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
        )}

        {!especialidad && especialidades.datos && especialidades.datos.length > 0 && (
          <p className="text-slate-600 text-sm">Elige una especialidad para ver sus horarios.</p>
        )}
      </section>

      <aside
        aria-labelledby="resumen-titulo"
        className="flex h-fit w-full flex-col gap-4 rounded-xl p-7 shadow-[0px_8px_24px_rgba(15,23,41,0.08)] lg:w-[360px] lg:shrink-0"
      >
        <h2 id="resumen-titulo" className="text-slate-900 text-[17px] font-bold">
          Resumen de tu cita
        </h2>
        <dl className="flex flex-col gap-4">
          <Dato etiqueta="Especialidad" valor={especialidad?.nombreEspecialidad} />
          <Dato
            etiqueta="Especialista"
            valor={especialidad?.especialista && `${especialidad.especialista.nombre} ${especialidad.especialista.apellido}`.trim()}
          />
          <Dato etiqueta="Fecha" valor={horario && fechaLarga(horario.fecha)} />
          <Dato etiqueta="Hora" valor={horario && `${hora12(horario.horaInicio)} – ${hora12(horario.horaFin)}`} />
        </dl>

        {errorGeneral && (
          <p role="alert" className="text-red-700 text-sm border border-red-700 rounded-lg p-3">
            {errorGeneral}
          </p>
        )}

        <button
          type="button"
          onClick={confirmar}
          aria-disabled={enviando || !horario}
          className={BOTON_PRIMARIO}
        >
          {enviando ? 'Confirmando…' : 'Confirmar cita'}
        </button>
        <p className="text-slate-600 text-xs">Solo usuarios autenticados pueden solicitar citas.</p>
      </aside>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-slate-600 text-xs">{etiqueta}</dt>
      <dd className={valor ? 'text-slate-900 text-[15px] font-semibold' : 'text-slate-600 text-[15px]'}>
        {valor || 'Por elegir'}
      </dd>
    </div>
  );
}
