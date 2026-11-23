import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import CargandoSesion from '../../components/CargandoSesion';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS, rutaInicioPorRol } from '../../routes/paths';
import { getErrorMessage } from '../../services/api';
import { solicitarRecuperacion } from '../../services/auth.service';
import { tieneErrores } from '../../utils/validaciones';
import { validarRecuperacion, type ErroresRecuperacion } from './validacion';

type Estado = 'editando' | 'enviando' | 'enviado';

// HU-05 — Recuperar contraseña, paso 1: pedir el enlace (POST /api/auth/recuperar-contrasena).
// El resultado es el mismo exista o no el correo: así nadie puede averiguar qué cuentas hay
// (escenario 2 de la HU). El paso 2 está en Restablecer.tsx. La cabecera y el <main> los pone <Layout>.
export default function HU05RecuperarContrasena() {
  useTitulo('Recuperar contraseña');

  const { sesion, verificando } = useAuth();
  const [correo, setCorreo] = useState('');
  const [errores, setErrores] = useState<ErroresRecuperacion>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>('editando');
  const [correoEnviado, setCorreoEnviado] = useState('');
  const controladorRef = useRef<AbortController | null>(null);
  const confirmacionRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);
  useEffect(() => {
    if (estado === 'enviado') confirmacionRef.current?.focus();
  }, [estado]);

  // Quien ya tiene sesión no necesita recuperar nada
  if (verificando) return <CargandoSesion />;
  if (sesion) return <Navigate to={rutaInicioPorRol(sesion.rol)} replace />;

  const enviando = estado === 'enviando';

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setErrorGeneral(null);

    const erroresCliente = validarRecuperacion(correo);
    if (tieneErrores(erroresCliente)) {
      setErrores(erroresCliente);
      document.getElementById('recuperar-correo')?.focus();
      return;
    }
    setErrores({});

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEstado('enviando');

    try {
      await solicitarRecuperacion({ correo: correo.trim() }, controlador.signal);
      setCorreoEnviado(correo.trim());
      setEstado('enviado');
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;
      setEstado('editando');
      setErrorGeneral(getErrorMessage(falla));
    }
  }

  function usarOtroCorreo() {
    setCorreo('');
    setEstado('editando');
  }

  return (
    <div className="flex flex-col items-center bg-white py-10 px-4 sm:py-16">
      {estado === 'enviado' ? (
        <div
          ref={confirmacionRef}
          tabIndex={-1}
          role="status"
          className="flex flex-col items-start bg-white w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)] focus:outline-none"
        >
          <h1 className="text-slate-900 text-2xl font-bold">Revisa tu correo</h1>
          <p className="text-slate-700 text-sm">
            Si <strong>{correoEnviado}</strong> está registrado, recibirás un enlace para restablecer tu contraseña. El
            enlace es de un solo uso y expira en 30 minutos.
          </p>
          <p className="text-slate-600 text-xs">
            ¿No llegó? Revisa la carpeta de correo no deseado o solicita otro enlace con el mismo correo u otro.
          </p>
          <button
            type="button"
            onClick={usarOtroCorreo}
            className="self-stretch text-[#1D6070] text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg border border-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
          >
            Solicitar otro enlace
          </button>
          <Link
            to={RUTAS.login}
            className="text-[#1D6070] text-[13px] font-medium underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form
          onSubmit={manejarEnvio}
          noValidate
          aria-busy={enviando}
          aria-labelledby="recuperar-titulo"
          className="flex flex-col items-start bg-white w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
        >
          <div className="flex flex-col gap-2">
            <h1 id="recuperar-titulo" className="text-slate-900 text-2xl font-bold">
              Recuperar contraseña
            </h1>
            <p className="text-slate-500 text-sm">
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          {errorGeneral && (
            <p role="alert" className="self-stretch text-red-700 text-sm border border-red-700 rounded-lg p-3">
              {errorGeneral}
            </p>
          )}

          <FormField
            id="recuperar-correo"
            label="Correo electrónico"
            type="email"
            value={correo}
            onChange={(valor) => {
              setCorreo(valor);
              setErrores({});
              setErrorGeneral(null);
            }}
            error={errores.correo}
            placeholder="nombre@correo.com"
            autoComplete="email"
            inputMode="email"
            required
            readOnly={enviando}
          />

          <button
            type="submit"
            aria-disabled={enviando}
            className="self-stretch bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          >
            {enviando ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </button>

          <Link
            to={RUTAS.login}
            className="text-[#1D6070] text-[13px] font-medium underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
          >
            ← Volver al inicio de sesión
          </Link>
        </form>
      )}
    </div>
  );
}
