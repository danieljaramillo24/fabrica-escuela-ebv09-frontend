import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS, rutaDetalleEspecialista } from '../../routes/paths';
import { listarEspecialidades } from '../../services/especialidades.service';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';
const ENLACE =
  'text-[#1D6070] text-sm font-semibold underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

// HU-08, escenario 3 — Detalle de una especialidad: nombre, descripción, duración y el especialista
// asociado. No tiene endpoint propio: se toma de GET /api/especialidades, el mismo que usa la lista.
export default function HU08DetalleEspecialidad() {
  const { idEspecialidad } = useParams();
  const id = Number(idEspecialidad);

  const { sesion } = useAuth();
  const { datos, cargando, error, recargar } = useCargaDatos(listarEspecialidades);
  const especialidad = (datos ?? []).find((e) => e.idEspecialidad === id) ?? null;
  useTitulo(especialidad ? especialidad.nombreEspecialidad : 'Especialidad');

  const esPaciente = sesion?.rol === 'ROLE_USUARIO';

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[760px] mx-auto">
      <Link to={RUTAS.especialidades} className={ENLACE}>
        ← Volver a especialidades
      </Link>

      {cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Cargando la especialidad…
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

      {datos && !especialidad && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-slate-100 p-6">
          <p role="status" className="text-slate-900 text-base font-medium">
            No encontramos esa especialidad.
          </p>
          <p className="text-slate-700 text-sm">Puede que ya no esté disponible. Revisa la lista para elegir otra.</p>
        </div>
      )}

      {especialidad && (
        <article className="flex flex-col gap-5 rounded-xl p-6 sm:p-10 shadow-[0px_8px_24px_rgba(15,23,41,0.08)]">
          <h1 className="text-slate-900 text-2xl font-bold">{especialidad.nombreEspecialidad}</h1>
          {especialidad.descripcion && <p className="text-slate-700 text-sm">{especialidad.descripcion}</p>}

          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-slate-600 text-xs">Duración de la consulta</dt>
              <dd className="text-slate-900 font-medium">{especialidad.duracionMinutos} min</dd>
            </div>
            {especialidad.especialista && (
              <div>
                <dt className="text-slate-600 text-xs">Especialista</dt>
                <dd className="text-slate-900 font-medium">
                  {especialidad.especialista.nombre} {especialidad.especialista.apellido}
                </dd>
              </div>
            )}
          </dl>

          {esPaciente && (
            <div className="flex flex-wrap gap-4">
              <Link to={`${RUTAS.solicitarCita}?especialidad=${especialidad.idEspecialidad}`} className={BOTON_PRIMARIO}>
                Solicitar cita
              </Link>
              {especialidad.especialista && (
                <Link to={rutaDetalleEspecialista(especialidad.especialista.idUsuario)} className={ENLACE}>
                  Ver perfil del especialista
                </Link>
              )}
            </div>
          )}
        </article>
      )}
    </div>
  );
}
