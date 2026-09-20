import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS, rutaInicioPorRol, rutaInternaSegura } from '../../routes/paths';
import { getErrorMessage } from '../../services/api';
import { iniciarSesion } from '../../services/auth.service';
import { tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_LOGIN,
  VALORES_INICIALES_LOGIN,
  validarLogin,
  type CampoLogin,
  type ErroresLogin,
  type ValoresLogin,
} from './validacion';

// HU-02 — Inicio de sesión (POST /api/auth/login). La cabecera y el <main> los pone <Layout>.
export default function HU02InicioDeSesion() {
  useTitulo('Iniciar sesión');

  const { sesion, iniciarSesion: abrirSesion } = useAuth();
  const ubicacion = useLocation();

  const [valores, setValores] = useState<ValoresLogin>(VALORES_INICIALES_LOGIN);
  const [errores, setErrores] = useState<ErroresLogin>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const controladorRef = useRef<AbortController | null>(null);

  // Al salir de la pantalla se cancela cualquier petición en curso
  useEffect(() => () => controladorRef.current?.abort(), []);

  // Ruta a la que se quería entrar antes de que pidiéramos iniciar sesión (ver <ProtectedRoute>)
  const desde = rutaInternaSegura((ubicacion.state as { desde?: unknown } | null)?.desde);

  // Quien ya tiene sesión no necesita ver el formulario
  if (sesion) return <Navigate to={desde ?? rutaInicioPorRol(sesion.rol)} replace />;

  function cambiarValor(campo: CampoLogin, valor: string) {
    setValores((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => {
      if (!previo[campo]) return previo;
      const siguiente = { ...previo };
      delete siguiente[campo];
      return siguiente;
    });
    setErrorGeneral(null);
  }

  function enfocar(campo: CampoLogin) {
    document.getElementById(`login-${campo}`)?.focus();
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setErrorGeneral(null);

    const erroresCliente = validarLogin(valores);
    if (tieneErrores(erroresCliente)) {
      setErrores(erroresCliente);
      const primero = CAMPOS_LOGIN.find((campo) => erroresCliente[campo]);
      if (primero) enfocar(primero);
      return;
    }
    setErrores({});

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEnviando(true);

    try {
      const respuesta = await iniciarSesion(
        { correo: valores.correo.trim(), contrasena: valores.contrasena },
        controlador.signal,
      );
      // Al guardar la sesión esta pantalla redirige sola (ver arriba)
      abrirSesion({
        token: respuesta.token,
        idUsuario: respuesta.idUsuario,
        nombre: respuesta.nombre,
        rol: respuesta.rol,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setEnviando(false);
      setErrorGeneral(getErrorMessage(error));
      setValores((previo) => ({ ...previo, contrasena: '' }));
      enfocar('contrasena');
    }
  }

  return (
    <div className="flex flex-col items-center bg-white py-10 px-4 sm:py-16">
      <form
        onSubmit={manejarEnvio}
        noValidate
        aria-busy={enviando}
        aria-labelledby="login-titulo"
        className="flex flex-col items-start bg-white w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
      >
        <div className="flex flex-col gap-2">
          <h1 id="login-titulo" className="text-slate-900 text-2xl font-bold">
            Iniciar sesión
          </h1>
          <p className="text-slate-500 text-sm">Accede a las funciones de la plataforma</p>
          {desde && <p className="text-slate-600 text-xs">Inicia sesión para continuar.</p>}
        </div>

        {errorGeneral && (
          <p role="alert" className="self-stretch text-red-700 text-sm border border-red-700 rounded-lg p-3">
            {errorGeneral}
          </p>
        )}

        <FormField
          id="login-correo"
          label="Correo electrónico"
          type="email"
          value={valores.correo}
          onChange={(valor) => cambiarValor('correo', valor)}
          error={errores.correo}
          placeholder="nombre@correo.com"
          autoComplete="email"
          inputMode="email"
          required
          readOnly={enviando}
        />
        <FormField
          id="login-contrasena"
          label="Contraseña"
          type="password"
          value={valores.contrasena}
          onChange={(valor) => cambiarValor('contrasena', valor)}
          error={errores.contrasena}
          placeholder="Tu contraseña"
          autoComplete="current-password"
          required
          readOnly={enviando}
        />

        <button
          type="submit"
          aria-disabled={enviando}
          className="self-stretch bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
        >
          {enviando ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>

        <p className="text-[#1D6070] text-[13px] font-medium">
          ¿No tienes cuenta?{' '}
          <Link to={RUTAS.registro} className="text-[#1D6070] underline font-medium">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
