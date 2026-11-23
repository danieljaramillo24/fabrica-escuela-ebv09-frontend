import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { obtenerEspecialista } from '../../services/especialistas.service';
import { listarHorariosDeEspecialista } from '../../services/horarios.service';
import { agruparPorFecha } from '../../utils/agenda';
import { fechaLarga, hoyISO, hora12 } from '../../utils/fechas';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';
const ENLACE =
  'text-[#1D6070] text-sm font-semibold underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

// HU-20 — Perfil de un especialista (escenario 2): sus datos de perfil, las especialidades que
// atiende y los horarios libres (GET /api/especialistas/{id} y GET /api/horarios/especialista/{id}).
// Los horarios reservados o bloqueados no se muestran: solo lo que se puede reservar.
export default function HU20DetalleEspecialista() {
  const { idEspecialista } = useParams();
  const id = Number(idEspecialista);
  const idValido = Number.isInteger(id) && id > 0;

  const perfil = useCargaDatos(
    (signal) => (idValido ? obtenerEspecialista(id, signal) : Promise.reject(new Error('id inválido'))),
    [id],
  );
  useTitulo(perfil.datos ? `${perfil.datos.nombre} ${perfil.datos.apellido}` : 'Especialista');

  const horarios = useCargaDatos(
    (signal) => (idValido ? listarHorariosDeEspecialista(id, signal) : Promise.resolve([])),
    [id],
  );

  const hoy = hoyISO();
  const grupos = useMemo(
    () => agruparPorFecha((horarios.datos ?? []).filter((h) => h.estado === 'LIBRE' && h.fecha >= hoy)),
    [horarios.datos, hoy],
  );

  const volver = (
    <Link to={RUTAS.especialistas} className={ENLACE}>
      ← Volver a especialistas
    </Link>
  );

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[900px] mx-auto">
      {volver}

      {perfil.cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Cargando el perfil…
        </p>
      )}

      {perfil.error && (
        <div className="flex flex-col items-start gap-3 border border-red-700 rounded-lg p-4">
          <p role="alert" className="text-red-700 text-sm">
            {idValido ? perfil.error : 'No encontramos a ese especialista.'}
          </p>
          {idValido && (
            <button type="button" onClick={perfil.recargar} className={BOTON_PRIMARIO}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {perfil.datos && (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 text-2xl font-bold">
              {perfil.datos.nombre} {perfil.datos.apellido}
            </h1>
            {perfil.datos.registroMedico && (
              <p className="text-slate-500 text-sm">Registro médico: {perfil.datos.registroMedico}</p>
            )}
          </div>

          <section aria-labelledby="especialidades-titulo" className="flex flex-col gap-3">
            <h2 id="especialidades-titulo" className="text-slate-900 text-base font-semibold">
              Especialidades
            </h2>
            {perfil.datos.especialidades.length === 0 ? (
              <p className="text-slate-700 text-sm rounded-lg bg-slate-100 p-4">Este especialista aún no tiene especialidades registradas.</p>
            ) : (
              <ul className="flex flex-wrap gap-3">
                {perfil.datos.especialidades.map((e) => (
                  <li key={e.idEspecialidad} className="flex flex-col gap-2 rounded-xl border border-slate-300 p-4">
                    <span className="text-slate-900 text-sm font-medium">{e.nombreEspecialidad}</span>
                    <Link
                      to={`${RUTAS.solicitarCita}?especialidad=${e.idEspecialidad}`}
                      aria-label={`Solicitar cita de ${e.nombreEspecialidad}`}
                      className={ENLACE}
                    >
                      Solicitar cita
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="disponibilidad-titulo" className="flex flex-col gap-4">
            <h2 id="disponibilidad-titulo" className="text-slate-900 text-base font-semibold">
              Horarios disponibles
            </h2>

            {horarios.cargando && (
              <p role="status" className="text-slate-600 text-sm">
                Consultando horarios…
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
              <p role="status" className="text-slate-700 text-sm rounded-lg bg-slate-100 p-4">
                Este especialista no tiene horarios disponibles por ahora. Vuelve a consultar más tarde.
              </p>
            )}

            {grupos.map(([dia, delDia]) => (
              <div key={dia} className="flex flex-col gap-2">
                <h3 className="text-slate-700 text-sm font-medium">{fechaLarga(dia)}</h3>
                <ul className="flex flex-wrap gap-2.5">
                  {delDia.map((h) => (
                    <li key={h.idHorario} className="rounded-lg border border-slate-500 bg-white px-4 py-2.5 text-slate-900 text-sm font-medium">
                      {hora12(h.horaInicio)} – {hora12(h.horaFin)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
