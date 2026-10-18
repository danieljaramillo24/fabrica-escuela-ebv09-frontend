import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BotonOpcion from '../../components/BotonOpcion';
import FormField from '../../components/FormField';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { listarEspecialidades } from '../../services/especialidades.service';
import { listarHorariosDisponibles } from '../../services/horarios.service';
import { agruparPorFecha } from '../../utils/agenda';
import { fechaLarga, hoyISO, hora12 } from '../../utils/fechas';
import { errorDeFechaFutura } from '../../utils/validaciones';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

// HU-10 — Consultar disponibilidad: GET /api/horarios/disponibles?idEspecialidad=…&fecha=…
// Muestra solo horarios libres (nunca los reservados o bloqueados) y se puede filtrar por fecha.
// Es una consulta: para reservar se pasa a HU-12 con la especialidad ya elegida.
export default function HU10ConsultarDisponibilidad() {
  useTitulo('Disponibilidad');

  const [parametros, setParametros] = useSearchParams();
  const idElegido = Number(parametros.get('especialidad'));
  const [fecha, setFecha] = useState('');
  const hoy = hoyISO();
  // El filtro de fecha es opcional: solo se valida si la persona escribió una
  const errorFecha = fecha ? errorDeFechaFutura(fecha, hoy) : null;
  const fechaConsulta = fecha && !errorFecha ? fecha : undefined;

  const especialidades = useCargaDatos(listarEspecialidades);
  const especialidad = useMemo(
    () => (especialidades.datos ?? []).find((e) => e.idEspecialidad === idElegido) ?? null,
    [especialidades.datos, idElegido],
  );

  const horarios = useCargaDatos(
    (signal) =>
      especialidad && !errorFecha
        ? listarHorariosDisponibles(
            { idEspecialidad: especialidad.idEspecialidad, idEspecialista: especialidad.especialista?.idUsuario ?? null },
            signal,
            fechaConsulta,
          )
        : Promise.resolve([]),
    [especialidad?.idEspecialidad, fechaConsulta, errorFecha],
  );

  const lista = useMemo(() => (horarios.cargando ? [] : (horarios.datos ?? [])), [horarios.cargando, horarios.datos]);
  const grupos = useMemo(() => agruparPorFecha(lista), [lista]);

  return (
    <div className="flex flex-col gap-8 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Disponibilidad del especialista</h1>
        <p className="text-slate-500 text-sm">Consulta los horarios libres de cada especialidad, por fecha si quieres.</p>
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
          <p className="text-slate-700 text-sm rounded-lg bg-slate-100 p-4">Aún no hay especialidades registradas.</p>
        )}
        {especialidades.datos && especialidades.datos.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {especialidades.datos.map((e) => (
              <BotonOpcion
                key={e.idEspecialidad}
                seleccionado={e.idEspecialidad === especialidad?.idEspecialidad}
                onClick={() => setParametros({ especialidad: String(e.idEspecialidad) }, { replace: true })}
              >
                {e.nombreEspecialidad}
              </BotonOpcion>
            ))}
          </div>
        )}
      </div>

      {especialidad && (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <section className="flex min-w-0 flex-1 flex-col gap-5" aria-labelledby="horarios-titulo">
            <div className="max-w-[240px]">
              <FormField
                id="disponibilidad-fecha"
                label="Filtrar por fecha"
                type="date"
                min={hoy}
                value={fecha}
                onChange={setFecha}
                error={errorFecha}
                hint="Déjala vacía para ver todas las fechas."
              />
            </div>

            <h2 id="horarios-titulo" className="text-slate-900 text-[15px] font-semibold">
              Horarios disponibles — {especialidad.nombreEspecialidad}
              {fechaConsulta ? ` · ${fechaLarga(fechaConsulta)}` : ''}
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
            {!horarios.cargando && !horarios.error && !errorFecha && grupos.length === 0 && (
              <p role="status" className="text-slate-700 text-sm rounded-lg bg-slate-100 p-4">
                {fechaConsulta
                  ? 'No hay horarios disponibles para esa fecha. Prueba con otra o quita el filtro.'
                  : 'No hay horarios disponibles para esta especialidad por ahora. Vuelve a consultar más tarde.'}
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

            {grupos.length > 0 && (
              <Link to={`${RUTAS.solicitarCita}?especialidad=${especialidad.idEspecialidad}`} className={`self-start ${BOTON_PRIMARIO}`}>
                Solicitar cita de {especialidad.nombreEspecialidad}
              </Link>
            )}
          </section>

          <aside aria-labelledby="info-titulo" className="w-full rounded-xl border border-slate-300 p-6 lg:w-[360px] lg:shrink-0">
            <h2 id="info-titulo" className="text-slate-900 text-[15px] font-semibold">
              Información del especialista
            </h2>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-slate-600 text-xs">Especialidad</dt>
                <dd className="text-slate-900 font-medium">{especialidad.nombreEspecialidad}</dd>
              </div>
              {especialidad.especialista && (
                <div>
                  <dt className="text-slate-600 text-xs">Especialista</dt>
                  <dd className="text-slate-900 font-medium">
                    {especialidad.especialista.nombre} {especialidad.especialista.apellido}
                  </dd>
                </div>
              )}
              {especialidad.duracionMinutos > 0 && (
                <div>
                  <dt className="text-slate-600 text-xs">Duración de la consulta</dt>
                  <dd className="text-slate-900 font-medium">{especialidad.duracionMinutos} min</dd>
                </div>
              )}
            </dl>
          </aside>
        </div>
      )}

      {!especialidad && especialidades.datos && especialidades.datos.length > 0 && (
        <p className="text-slate-600 text-sm">Elige una especialidad para consultar sus horarios.</p>
      )}
    </div>
  );
}
