import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import CargandoSesion from '../../components/CargandoSesion';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS, rutaInicioPorRol } from '../../routes/paths';
import { ApiError, getErrorMessage } from '../../services/api';
import { restablecerContrasena } from '../../services/auth.service';
import { tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_RESTABLECER,
  MIN_CONTRASENA,
  VALORES_INICIALES_RESTABLECER,
  esCampoRestablecer,
  validarRestablecer,
  type CampoRestablecer,
  type ErroresRestablecer,
  type ValoresRestablecer,
} from './validacion';

type Estado = 'editando' | 'enviando' | 'exito' | 'enlaceInvalido';

const ENLACE =
  'text-[#1D6070] text-[13px] font-medium underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';
const BOTON_ENLACE =
  'self-stretch text-center bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

// HU-05 — Recuperar contraseña, paso 2: la nueva clave (POST /api/auth/restablecer-contrasena).
// A esta pantalla se llega desde el enlace del correo: `/restablecer-contrasena?token=…`. El
// servidor invalida el enlace al usarlo o al expirar (RF-05.4); aquí solo se muestra el resultado.
export default function HU05RestablecerContrasena() {
  useTitulo('Nueva contraseña');

  const { sesion, verificando } = useAuth();
  const [parametros] = useSearchParams();
  const token = parametros.get('token')?.trim() ?? '';

  const [valores, setValores] = useState<ValoresRestablecer>(VALORES_INICIALES_RESTABLECER);
  const [errores, setErrores] = useState<ErroresRestablecer>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>(token ? 'editando' : 'enlaceInvalido');
  const controladorRef = useRef<AbortController | null>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);
  useEffect(() => {
    if (estado === 'exito' || estado === 'enlaceInvalido') resultadoRef.current?.focus();
  }, [estado]);

  if (verificando) return <CargandoSesion />;
  if (sesion) return <Navigate to={rutaInicioPorRol(sesion.rol)} replace />;

  const enviando = estado === 'enviando';

  function cambiarValor(campo: CampoRestablecer, valor: string) {
    setValores((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => {
      if (!previo[campo]) return previo;
      const siguiente = { ...previo };
      delete siguiente[campo];
      return siguiente;
    });
    setErrorGeneral(null);
  }

  function enfocarPrimerError(conErrores: ErroresRestablecer) {
    const primero = CAMPOS_RESTABLECER.find((campo) => conErrores[campo]);
    if (primero) document.getElementById(`restablecer-${primero}`)?.focus();
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setErrorGeneral(null);

    const erroresCliente = validarRestablecer(valores);
    if (tieneErrores(erroresCliente)) {
      setErrores(erroresCliente);
      enfocarPrimerError(erroresCliente);
      return;
    }
    setErrores({});

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEstado('enviando');

    try {
      await restablecerContrasena(
        { token, contrasena: valores.contrasena, confirmarContrasena: valores.confirmarContrasena },
        controlador.signal,
      );
      // La clave ya no debe quedar en memoria de la pantalla
      setValores(VALORES_INICIALES_RESTABLECER);
      setEstado('exito');
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;

      // Enlace vencido, usado o inexistente (escenario 3: se invalida tras usarse)
      if (falla instanceof ApiError && falla.status === 410) {
        setErrorGeneral(falla.message);
        setEstado('enlaceInvalido');
        return;
      }
      setEstado('editando');

      if (falla instanceof ApiError && tieneErrores(falla.fieldErrors)) {
        const delServidor: ErroresRestablecer = {};
        for (const [clave, mensaje] of Object.entries(falla.fieldErrors)) {
          if (esCampoRestablecer(clave)) delServidor[clave] = mensaje;
        }
        if (tieneErrores(delServidor)) {
          setErrores(delServidor);
          enfocarPrimerError(delServidor);
          return;
        }
      }
      setErrorGeneral(getErrorMessage(falla));
    }
  }

  return (
    <div className="flex flex-col items-center bg-white py-10 px-4 sm:py-16">
      {estado === 'exito' && (
        <div
          ref={resultadoRef}
          tabIndex={-1}
          role="status"
          className="flex flex-col items-start bg-white w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)] focus:outline-none"
        >
          <h1 className="text-slate-900 text-2xl font-bold">¡Contraseña actualizada!</h1>
          <p className="text-slate-700 text-sm">
            Ya puedes iniciar sesión con tu nueva contraseña. El enlace que usaste dejó de funcionar.
          </p>
          <Link to={RUTAS.login} className={BOTON_ENLACE}>
            Volver al inicio de sesión
          </Link>
        </div>
      )}

      {estado === 'enlaceInvalido' && (
        <div
          ref={resultadoRef}
          tabIndex={-1}
          className="flex flex-col items-start bg-white w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)] focus:outline-none"
        >
          <h1 className="text-slate-900 text-2xl font-bold">Este enlace ya no sirve</h1>
          <p role="alert" className="text-slate-700 text-sm">
            {errorGeneral ?? 'El enlace de recuperación no es válido: expiró, ya se usó o está incompleto. Solicita uno nuevo para continuar.'}
          </p>
          <Link to={RUTAS.recuperarContrasena} className={BOTON_ENLACE}>
            Solicitar un enlace nuevo
          </Link>
          <Link to={RUTAS.login} className={ENLACE}>
            Volver al inicio de sesión
          </Link>
        </div>
      )}

      {(estado === 'editando' || estado === 'enviando') && (
        <form
          onSubmit={manejarEnvio}
          noValidate
          aria-busy={enviando}
          aria-labelledby="restablecer-titulo"
          className="flex flex-col items-start bg-white w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
        >
          <div className="flex flex-col gap-2">
            <h1 id="restablecer-titulo" className="text-slate-900 text-2xl font-bold">
              Nueva contraseña
            </h1>
            <p className="text-slate-500 text-sm">Elige una contraseña que no uses en otros sitios.</p>
            <p className="text-slate-600 text-xs">Los campos marcados con * son obligatorios.</p>
          </div>

          {errorGeneral && (
            <p role="alert" className="self-stretch text-red-700 text-sm border border-red-700 rounded-lg p-3">
              {errorGeneral}
            </p>
          )}

          <FormField
            id="restablecer-contrasena"
            label="Nueva contraseña"
            type="password"
            value={valores.contrasena}
            onChange={(valor) => cambiarValor('contrasena', valor)}
            error={errores.contrasena}
            hint={`Mínimo ${MIN_CONTRASENA} caracteres.`}
            autoComplete="new-password"
            required
            readOnly={enviando}
          />
          <FormField
            id="restablecer-confirmarContrasena"
            label="Confirmar contraseña"
            type="password"
            value={valores.confirmarContrasena}
            onChange={(valor) => cambiarValor('confirmarContrasena', valor)}
            error={errores.confirmarContrasena}
            autoComplete="new-password"
            required
            readOnly={enviando}
          />

          <button
            type="submit"
            aria-disabled={enviando}
            className="self-stretch bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          >
            {enviando ? 'Guardando…' : 'Guardar nueva contraseña'}
          </button>
        </form>
      )}
    </div>
  );
}
