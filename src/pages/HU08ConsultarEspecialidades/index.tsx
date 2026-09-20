import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { listarEspecialidades } from '../../services/especialidades.service';
import type { Especialidad } from '../../types/especialidad';

function coincide(especialidad: Especialidad, busqueda: string): boolean {
  const texto = `${especialidad.nombreEspecialidad} ${especialidad.descripcion}`.toLowerCase();
  return texto.includes(busqueda.trim().toLowerCase());
}

// HU-08 — Consultar especialidades (GET /api/especialidades). El prototipo de Figma no tiene una
// pantalla propia para esta historia: se diseñó con el mismo sistema visual.
export default function HU08ConsultarEspecialidades() {
  useTitulo('Especialidades');

  const { sesion } = useAuth();
  const { datos, cargando, error, recargar } = useCargaDatos(listarEspecialidades);
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => (datos ?? []).filter((e) => coincide(e, busqueda)), [datos, busqueda]);
  const esEspecialista = sesion?.rol === 'ROLE_ESPECIALISTA';

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Especialidades</h1>
        <p className="text-slate-500 text-sm">Consulta las especialidades disponibles y elige la que necesitas.</p>
      </div>

      {cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Cargando especialidades…
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

      {datos && datos.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-slate-100 p-6">
          <p className="text-slate-900 text-base font-medium">Aún no hay especialidades registradas.</p>
          <p className="text-slate-700 text-sm">
            {esEspecialista ? (
              <>
                Puedes empezar{' '}
                <Link to={RUTAS.registrarEspecialidad} className="text-[#1D6070] underline font-medium">
                  registrando la primera
                </Link>
                .
              </>
            ) : (
              'Vuelve a revisar más tarde: los especialistas irán agregando sus consultas.'
            )}
          </p>
        </div>
      )}

      {datos && datos.length > 0 && (
        <>
          <div className="max-w-[380px]">
            <FormField
              id="especialidades-busqueda"
              label="Buscar especialidad"
              type="search"
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Ej. Cardiología"
            />
          </div>

          <p role="status" className="text-slate-600 text-sm">
            {visibles.length} de {datos.length} {datos.length === 1 ? 'especialidad' : 'especialidades'}
          </p>

          {visibles.length === 0 ? (
            <p className="text-slate-700 text-sm">Ninguna especialidad coincide con tu búsqueda. Prueba con otra palabra.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((especialidad) => (
                <li
                  key={especialidad.idEspecialidad}
                  className="flex flex-col gap-3 rounded-xl p-6 shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
                >
                  <h2 className="text-slate-900 text-lg font-bold">{especialidad.nombreEspecialidad}</h2>
                  {especialidad.descripcion && <p className="text-slate-700 text-sm">{especialidad.descripcion}</p>}
                  <p className="text-slate-600 text-sm">Duración: {especialidad.duracionMinutos} min</p>
                  {especialidad.especialista && (
                    <p className="text-slate-600 text-sm">
                      Especialista: {especialidad.especialista.nombre} {especialidad.especialista.apellido}
                    </p>
                  )}
                  {!esEspecialista && (
                    <Link
                      to={`${RUTAS.solicitarCita}?especialidad=${especialidad.idEspecialidad}`}
                      aria-label={`Solicitar cita de ${especialidad.nombreEspecialidad}`}
                      className="self-start text-[#1D6070] text-sm font-semibold underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
                    >
                      Solicitar cita
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
