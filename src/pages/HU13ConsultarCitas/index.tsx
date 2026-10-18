import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { ApiError } from '../../services/api';
import { listarMisCitas } from '../../services/citas.service';
import type { Cita } from '../../types/cita';
import { citaVigente, claseEstadoCita, etiquetaEstadoCita, ordenarCitas } from '../../utils/citas';
import { fechaCorta, fechaLarga, hora12 } from '../../utils/fechas';
import CancelarCitaDialogo from '../HU14CancelarCita';

const ENLACE_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

// HU-13 — Consultar citas: GET /api/citas/usuario/{id}. Solo ROLE_USUARIO y solo sus propias citas
// (el id sale de la sesión y el servidor lo vuelve a comprobar). Desde aquí se cancela (HU-14) y se
// llega a reprogramar (HU-15).
export default function HU13ConsultarCitas() {
  useTitulo('Mis citas');

  const { sesion } = useAuth();
  const idUsuario = sesion?.idUsuario;
  const { datos, cargando, error, recargar } = useCargaDatos(
    (signal) => (idUsuario === undefined ? Promise.reject(new ApiError(401, '')) : listarMisCitas(idUsuario, signal)),
    [idUsuario],
  );

  const [idElegida, setIdElegida] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<Cita | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  const citas = useMemo(() => ordenarCitas(datos ?? []), [datos]);
  const elegida = citas.find((c) => c.idCita === idElegida) ?? citas[0] ?? null;
  const modificable = elegida ? citaVigente(elegida) : false;

  function alCancelar() {
    setConfirmacion('Tu cita fue cancelada y el horario quedó libre.');
    setCancelando(null);
    recargar();
  }

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Mis citas</h1>
        <p className="text-slate-500 text-sm">Consulta el detalle de tus citas programadas</p>
      </div>

      {confirmacion && (
        <p role="status" className="text-green-800 text-sm border border-green-800 rounded-lg p-3">
          {confirmacion}
        </p>
      )}

      {cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Cargando tus citas…
        </p>
      )}

      {error && (
        <div className="flex flex-col items-start gap-3 border border-red-700 rounded-lg p-4">
          <p role="alert" className="text-red-700 text-sm">
            {error}
          </p>
          <button type="button" onClick={recargar} className={ENLACE_PRIMARIO}>
            Reintentar
          </button>
        </div>
      )}

      {datos && !cargando && citas.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-slate-100 p-6">
          <p className="text-slate-900 text-base font-medium">No tienes citas programadas.</p>
          <p className="text-slate-700 text-sm">Cuando solicites una, la verás aquí con todos sus datos.</p>
          <Link to={RUTAS.solicitarCita} className={ENLACE_PRIMARIO}>
            Solicitar una cita
          </Link>
        </div>
      )}

      {datos && citas.length > 0 && (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <ul aria-label="Lista de citas, de la más próxima a la más lejana" className="flex flex-1 min-w-0 flex-col gap-3">
            {citas.map((cita) => (
              <li key={cita.idCita}>
                <button
                  type="button"
                  onClick={() => setIdElegida(cita.idCita)}
                  aria-pressed={cita.idCita === elegida?.idCita}
                  className={`flex w-full items-center justify-between gap-4 rounded-xl border bg-white px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] ${
                    cita.idCita === elegida?.idCita ? 'border-[#1D6070] border-2' : 'border-slate-300 hover:border-[#1D6070]'
                  }`}
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-slate-900 text-base font-semibold">{cita.especialidad}</span>
                    <span className="text-slate-600 text-[13px]">
                      {cita.especialista} · {fechaCorta(cita.fecha)} · {hora12(cita.hora)}
                    </span>
                  </span>
                  <span className={`text-[13px] font-medium ${claseEstadoCita(cita.estado)}`}>{etiquetaEstadoCita(cita.estado)}</span>
                </button>
              </li>
            ))}
          </ul>

          {elegida && (
            <aside aria-labelledby="detalle-cita" className="w-full rounded-xl border border-slate-300 p-6 lg:w-[400px] lg:shrink-0">
              <h2 id="detalle-cita" className="text-slate-900 text-base font-semibold">
                Detalle de la cita
              </h2>
              <dl className="mt-5 flex flex-col gap-3">
                <Dato etiqueta="Especialidad" valor={elegida.especialidad} />
                <Dato etiqueta="Especialista" valor={elegida.especialista} />
                <Dato etiqueta="Fecha" valor={fechaLarga(elegida.fecha)} />
                <Dato etiqueta="Hora" valor={hora12(elegida.hora)} />
                {elegida.duracionMinutos > 0 && <Dato etiqueta="Duración" valor={`${elegida.duracionMinutos} minutos`} />}
                <Dato etiqueta="Estado" valor={etiquetaEstadoCita(elegida.estado)} />
              </dl>

              {modificable ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to={`${RUTAS.reprogramarCita}?id=${elegida.idCita}`}
                    className="flex-1 text-center text-[#1D6070] text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg border border-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
                  >
                    Reprogramar
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCancelando(elegida)}
                    className="flex-1 bg-red-700 text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700"
                  >
                    Cancelar cita
                  </button>
                </div>
              ) : (
                <p className="mt-6 text-slate-600 text-xs">Esta cita ya no admite cambios.</p>
              )}
            </aside>
          )}
        </div>
      )}

      {cancelando && (
        <CancelarCitaDialogo cita={cancelando} onMantener={() => setCancelando(null)} onCancelada={alCancelar} />
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-slate-600 text-xs">{etiqueta}</dt>
      <dd className="text-slate-900 text-sm font-medium">{valor}</dd>
    </div>
  );
}
