import { Link } from 'react-router-dom';
import { useTitulo } from '../../../hooks/useTitulo';
import { RUTAS } from '../../../routes/paths';

// Pantalla común, sin HU propia: por eso está en `pages/comunes/` y no junto a las carpetas de HU.
export default function NoEncontrada() {
  useTitulo('Página no encontrada');

  return (
    <div className="flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="flex flex-col items-start w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]">
        <h1 className="text-slate-900 text-2xl font-bold">No encontramos esta página</h1>
        <p className="text-slate-700 text-sm">
          La dirección no existe o cambió de lugar. Puedes volver al inicio y continuar desde ahí.
        </p>
        <Link
          to={RUTAS.inicio}
          className="self-stretch text-center bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
