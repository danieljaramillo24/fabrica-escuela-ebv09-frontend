import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTitulo } from '../hooks/useTitulo';
import { RUTAS, rutaInicioPorRol } from '../routes/paths';

// Estado de "permisos insuficientes" (CodeFactory 8.4): sesión válida, pero sin el rol requerido
export default function AccesoDenegado() {
  useTitulo('Acceso restringido');
  const { sesion } = useAuth();
  const inicio = sesion ? rutaInicioPorRol(sesion.rol) : RUTAS.inicio;

  return (
    <div className="flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="flex flex-col items-start w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]">
        <h1 className="text-slate-900 text-2xl font-bold">No tienes acceso a esta página</h1>
        <p role="alert" className="text-slate-700 text-sm">
          Tu cuenta no tiene los permisos necesarios para ver esta sección. Si crees que es un error, contacta a un
          administrador.
        </p>
        <Link
          to={inicio}
          className="self-stretch text-center bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
