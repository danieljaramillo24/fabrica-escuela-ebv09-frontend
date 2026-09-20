import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/FormField';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { ApiError, getErrorMessage } from '../../services/api';
import { registrarUsuario } from '../../services/usuarios.service';
import type { UsuarioResponse } from '../../types/usuario';
import {
  CAMPOS_REGISTRO,
  MIN_CONTRASENA,
  VALORES_INICIALES,
  construirSolicitud,
  esCampoRegistro,
  esCorreoDuplicado,
  validarRegistro,
  type CampoRegistro,
  type ErroresRegistro,
  type ValoresRegistro,
} from './validacion';

type Estado = 'editando' | 'enviando' | 'exito';

// HU-01 — Registro de usuario (POST /api/usuarios). La cabecera y el <main> los pone <Layout>.
export default function HU01RegistroDeCliente() {
  useTitulo('Crear cuenta');

  const [valores, setValores] = useState<ValoresRegistro>(VALORES_INICIALES);
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [correoDuplicado, setCorreoDuplicado] = useState(false);
  const [estado, setEstado] = useState<Estado>('editando');
  const [usuarioCreado, setUsuarioCreado] = useState<UsuarioResponse | null>(null);

  const controladorRef = useRef<AbortController | null>(null);
  const exitoRef = useRef<HTMLDivElement>(null);

  // Al salir de la pantalla se cancela cualquier petición en curso
  useEffect(() => () => controladorRef.current?.abort(), []);

  // Al confirmarse el registro, el foco pasa al mensaje para que lo lean los lectores de pantalla
  useEffect(() => {
    if (estado === 'exito') exitoRef.current?.focus();
  }, [estado]);

  const enviando = estado === 'enviando';

  function cambiarValor(campo: CampoRegistro, valor: string) {
    setValores((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => {
      if (!previo[campo]) return previo;
      const siguiente = { ...previo };
      delete siguiente[campo];
      return siguiente;
    });
    if (campo === 'correo') setCorreoDuplicado(false);
    setErrorGeneral(null);
  }

  function enfocarPrimerError(conErrores: ErroresRegistro) {
    const primero = CAMPOS_REGISTRO.find((campo) => conErrores[campo]);
    if (primero) document.getElementById(`registro-${primero}`)?.focus();
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    setErrorGeneral(null);
    setCorreoDuplicado(false);

    const erroresCliente = validarRegistro(valores);
    if (Object.keys(erroresCliente).length > 0) {
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
      const creado = await registrarUsuario(construirSolicitud(valores), controlador.signal);
      setUsuarioCreado(creado);
      setValores(VALORES_INICIALES);
      setEstado('exito');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setEstado('editando');

      // Errores por campo que responde el servidor: { campo: "mensaje" }
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        const delServidor: ErroresRegistro = {};
        for (const [clave, mensaje] of Object.entries(error.fieldErrors)) {
          if (esCampoRegistro(clave)) delServidor[clave] = mensaje;
        }
        if (Object.keys(delServidor).length > 0) {
          setErrores(delServidor);
          enfocarPrimerError(delServidor);
          return;
        }
      }

      const mensaje = getErrorMessage(error);
      if (esCorreoDuplicado(mensaje)) {
        const conCorreo: ErroresRegistro = { correo: 'Ya existe una cuenta con este correo.' };
        setCorreoDuplicado(true);
        setErrores(conCorreo);
        enfocarPrimerError(conCorreo);
        return;
      }
      setErrorGeneral(mensaje);
    }
  }

  return (
    <div className="flex flex-col items-center bg-white py-10 px-4 sm:py-16">
      {estado === 'exito' && usuarioCreado ? (
        <div
          ref={exitoRef}
          tabIndex={-1}
          role="status"
          className="flex flex-col items-start bg-white w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)] focus:outline-none"
        >
          <h1 className="text-slate-900 text-2xl font-bold">¡Cuenta creada!</h1>
          <p className="text-slate-700 text-sm">
            Registramos la cuenta de {usuarioCreado.nombre} {usuarioCreado.apellido} con el correo{' '}
            <strong>{usuarioCreado.correo}</strong>. Ya puedes iniciar sesión para gestionar tus citas médicas.
          </p>
          <Link
            to={RUTAS.login}
            className="self-stretch text-center bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form
          onSubmit={manejarEnvio}
          noValidate
          aria-busy={enviando}
          aria-labelledby="registro-titulo"
          className="flex flex-col items-start bg-white w-full max-w-[460px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
        >
          <div className="flex flex-col gap-2">
            <h1 id="registro-titulo" className="text-slate-900 text-2xl font-bold">
              Crear cuenta
            </h1>
            <p className="text-slate-500 text-sm">Regístrate para gestionar tus citas médicas</p>
            <p className="text-slate-600 text-xs">Los campos marcados con * son obligatorios.</p>
          </div>

          {errorGeneral && (
            <p role="alert" className="self-stretch text-red-700 text-sm border border-red-700 rounded-lg p-3">
              {errorGeneral}
            </p>
          )}

          <FormField
            id="registro-nombre"
            label="Nombre"
            value={valores.nombre}
            onChange={(valor) => cambiarValor('nombre', valor)}
            error={errores.nombre}
            placeholder="Ej. Ana María"
            autoComplete="given-name"
            required
            readOnly={enviando}
          />
          <FormField
            id="registro-apellido"
            label="Apellido"
            value={valores.apellido}
            onChange={(valor) => cambiarValor('apellido', valor)}
            error={errores.apellido}
            placeholder="Ej. Pérez"
            autoComplete="family-name"
            required
            readOnly={enviando}
          />
          <FormField
            id="registro-correo"
            label="Correo electrónico"
            type="email"
            value={valores.correo}
            onChange={(valor) => cambiarValor('correo', valor)}
            error={
              errores.correo &&
              (correoDuplicado ? (
                <>
                  {errores.correo}{' '}
                  <Link to={RUTAS.login} className="underline font-medium">
                    ¿Deseas iniciar sesión?
                  </Link>
                </>
              ) : (
                errores.correo
              ))
            }
            placeholder="nombre@correo.com"
            autoComplete="email"
            inputMode="email"
            required
            readOnly={enviando}
          />
          <FormField
            id="registro-telefono"
            label="Teléfono"
            type="tel"
            value={valores.telefono}
            onChange={(valor) => cambiarValor('telefono', valor)}
            error={errores.telefono}
            placeholder="Ej. 3001234567"
            autoComplete="tel"
            inputMode="tel"
            readOnly={enviando}
          />
          <FormField
            id="registro-contrasena"
            label="Contraseña"
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
            id="registro-confirmarContrasena"
            label="Confirmar contraseña"
            type="password"
            value={valores.confirmarContrasena}
            onChange={(valor) => cambiarValor('confirmarContrasena', valor)}
            error={errores.confirmarContrasena}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            required
            readOnly={enviando}
          />

          <button
            type="submit"
            aria-disabled={enviando}
            className="self-stretch bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          >
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <p className="text-[#1D6070] text-[13px] font-medium">
            ¿Ya tienes cuenta?{' '}
            <Link to={RUTAS.login} className="text-[#1D6070] underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
