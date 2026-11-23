import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/FormField';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { rutaDetalleEspecialista } from '../../routes/paths';
import { listarEspecialistas } from '../../services/especialistas.service';
import type { Especialista } from '../../types/especialista';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

function coincide(especialista: Especialista, busqueda: string): boolean {
  const texto = [
    especialista.nombre,
    especialista.apellido,
    ...especialista.especialidades.map((e) => e.nombreEspecialidad),
  ]
    .join(' ')
    .toLowerCase();
  return texto.includes(busqueda.trim().toLowerCase());
}

// HU-20 — Consultar especialistas: GET /api/especialistas. Para ROLE_USUARIO. Solo se muestran
// los datos de perfil (nombre, especialidades y registro médico): el correo y el teléfono de la
// cuenta no se exponen a los pacientes. El detalle y la disponibilidad están en Detalle.tsx.
export default function HU20ConsultarEspecialistas() {
  useTitulo('Especialistas');

  const { datos, cargando, error, recargar } = useCargaDatos(listarEspecialistas);
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => (datos ?? []).filter((e) => coincide(e, busqueda)), [datos, busqueda]);

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Especialistas</h1>
        <p className="text-slate-500 text-sm">Conoce el perfil y la disponibilidad de los especialistas antes de reservar.</p>
      </div>

      {cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Cargando especialistas…
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

      {datos && datos.length === 0 && (
        <div className="flex flex-col items-start gap-2 rounded-lg bg-slate-100 p-6">
          <p className="text-slate-900 text-base font-medium">Aún no hay especialistas registrados.</p>
          <p className="text-slate-700 text-sm">Vuelve a revisar más tarde: la clínica irá habilitando a sus profesionales.</p>
        </div>
      )}

      {datos && datos.length > 0 && (
        <>
          <div className="max-w-[380px]">
            <FormField
              id="especialistas-busqueda"
              label="Buscar especialista"
              type="search"
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Nombre o especialidad"
            />
          </div>

          <p role="status" className="text-slate-600 text-sm">
            {visibles.length} de {datos.length} {datos.length === 1 ? 'especialista' : 'especialistas'}
          </p>

          {visibles.length === 0 ? (
            <p className="text-slate-700 text-sm">Ningún especialista coincide con tu búsqueda. Prueba con otra palabra.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((especialista) => (
                <li
                  key={especialista.idUsuario}
                  className="flex flex-col gap-3 rounded-xl p-6 shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
                >
                  <h2 className="text-slate-900 text-lg font-bold">
                    {especialista.nombre} {especialista.apellido}
                  </h2>
                  <p className="text-slate-700 text-sm">
                    {especialista.especialidades.length > 0
                      ? especialista.especialidades.map((e) => e.nombreEspecialidad).join(', ')
                      : 'Sin especialidades registradas'}
                  </p>
                  {especialista.registroMedico && (
                    <p className="text-slate-600 text-sm">Registro médico: {especialista.registroMedico}</p>
                  )}
                  <Link
                    to={rutaDetalleEspecialista(especialista.idUsuario)}
                    aria-label={`Ver perfil de ${especialista.nombre} ${especialista.apellido}`}
                    className="self-start text-[#1D6070] text-sm font-semibold underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
                  >
                    Ver perfil
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
