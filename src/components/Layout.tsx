import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo-vitalis.jpg';
import { useAuth } from '../hooks/useAuth';
import { RUTAS } from '../routes/paths';
import type { Rol } from '../types/auth';

interface EnlaceNav {
  a: string;
  texto: string;
}

// Solo se muestran destinos que ya existen en el Sprint 1. "Mis citas", "Ayuda" y "Perfil" del
// prototipo llegan con HU-13, la ayuda y HU-03.
function enlacesPorRol(rol: Rol | null): EnlaceNav[] {
  if (rol === 'ROLE_ESPECIALISTA') {
    return [
      { a: RUTAS.registrarEspecialidad, texto: 'Mis especialidades' },
      { a: RUTAS.horarios, texto: 'Mi agenda' },
    ];
  }
  if (rol === 'ROLE_USUARIO') {
    return [
      { a: RUTAS.especialidades, texto: 'Especialidades' },
      { a: RUTAS.solicitarCita, texto: 'Solicitar cita' },
    ];
  }
  return [{ a: RUTAS.especialidades, texto: 'Especialidades' }];
}

const CLASE_ENLACE =
  'text-sm font-medium leading-[normal] rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

export default function Layout() {
  const { sesion, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const principalRef = useRef<HTMLElement>(null);
  const rutaPrevia = useRef(pathname);

  // Al cambiar de pantalla, el foco pasa al contenido: así lo anuncian los lectores de pantalla
  useEffect(() => {
    if (rutaPrevia.current !== pathname) {
      rutaPrevia.current = pathname;
      principalRef.current?.focus();
    }
  }, [pathname]);

  function salir() {
    cerrarSesion();
    navegar(RUTAS.login);
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <a
        href="#contenido"
        onClick={(evento) => {
          evento.preventDefault();
          principalRef.current?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:ring-2 focus:ring-[#1D6070]"
      >
        Saltar al contenido
      </a>

      <header className="flex flex-wrap items-center justify-between gap-4 bg-white py-5 px-4 sm:px-12">
        <Link
          to={RUTAS.inicio}
          className="rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
        >
          <img src={logo} alt="Vitalis, ir al inicio" className="w-[81px] h-[81px] object-fill" />
        </Link>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <nav aria-label="Principal">
            <ul className="flex flex-wrap items-center gap-6">
              {enlacesPorRol(sesion?.rol ?? null).map((enlace) => (
                <li key={enlace.a}>
                  <NavLink
                    to={enlace.a}
                    className={({ isActive }) =>
                      `${CLASE_ENLACE} ${isActive ? 'text-[#1D6070] underline' : 'text-slate-500 hover:text-slate-900'}`
                    }
                  >
                    {enlace.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {sesion ? (
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-slate-700 text-sm">Hola, {sesion.nombre}</span>
              <button
                type="button"
                onClick={salir}
                className="text-sm font-medium leading-[normal] text-[#1D6070] underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Link to={RUTAS.login} className={`${CLASE_ENLACE} text-[#1D6070] underline`}>
                Iniciar sesión
              </Link>
              <Link
                to={RUTAS.registro}
                className="bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </header>

      <main id="contenido" ref={principalRef} tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}
