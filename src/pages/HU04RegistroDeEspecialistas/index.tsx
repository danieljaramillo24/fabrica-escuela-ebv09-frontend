import { useEffect, useRef, useState, type FormEvent } from 'react';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useTitulo } from '../../hooks/useTitulo';
import { ApiError, getErrorMessage } from '../../services/api';
import { registrarEspecialista } from '../../services/usuarios.service';
import type { Perfil } from '../../types/usuario';
import { esCorreoDuplicado, tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_ESPECIALISTA,
  MIN_CONTRASENA,
  VALORES_INICIALES_ESPECIALISTA,
  construirSolicitudEspecialista,
  esCampoEspecialista,
  validarEspecialista,
  type CampoEspecialista,
  type ErroresEspecialista,
  type ValoresEspecialista,
} from './validacion';

type Estado = 'editando' | 'enviando' | 'exito';

// HU-04 — Registro de especialistas: POST /api/especialistas. Solo ROLE_ADMIN: la ruta la protege
// <ProtectedRoute> y el servidor vuelve a comprobarlo (HU-24). El backend asigna el rol de
// especialista a la cuenta creada, para que pueda iniciar sesión.
export default function HU04RegistroDeEspecialistas() {
  useTitulo('Registrar especialista');

  const { cerrarSesion } = useAuth();
  const [valores, setValores] = useState<ValoresEspecialista>(VALORES_INICIALES_ESPECIALISTA);
  const [errores, setErrores] = useState<ErroresEspecialista>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>('editando');
  const [creado, setCreado] = useState<Perfil | null>(null);

  const controladorRef = useRef<AbortController | null>(null);
  const exitoRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);
  useEffect(() => {
    if (estado === 'exito') exitoRef.current?.focus();
  }, [estado]);

  const enviando = estado === 'enviando';

  function cambiarValor(campo: CampoEspecialista, valor: string) {
    setValores((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => {
      if (!previo[campo]) return previo;
      const siguiente = { ...previo };
      delete siguiente[campo];
      return siguiente;
    });
    setErrorGeneral(null);
  }

  function enfocarPrimerError(conErrores: ErroresEspecialista) {
    const primero = CAMPOS_ESPECIALISTA.find((campo) => conErrores[campo]);
    if (primero) document.getElementById(`especialista-${primero}`)?.focus();
  }

  function registrarOtro() {
    setValores(VALORES_INICIALES_ESPECIALISTA);
    setErrores({});
    setCreado(null);
    setEstado('editando');
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setErrorGeneral(null);

    const erroresCliente = validarEspecialista(valores);
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
      setCreado(await registrarEspecialista(construirSolicitudEspecialista(valores), controlador.signal));
      setValores(VALORES_INICIALES_ESPECIALISTA);
      setEstado('exito');
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;
      if (falla instanceof ApiError && falla.status === 401) {
        cerrarSesion();
        return;
      }
      setEstado('editando');

      if (falla instanceof ApiError && tieneErrores(falla.fieldErrors)) {
        const delServidor: ErroresEspecialista = {};
        for (const [clave, mensaje] of Object.entries(falla.fieldErrors)) {
          if (esCampoEspecialista(clave)) delServidor[clave] = mensaje;
        }
        if (tieneErrores(delServidor)) {
          setErrores(delServidor);
          enfocarPrimerError(delServidor);
          return;
        }
      }

      // Escenario 3: el correo ya existe, no se duplica el registro
      const mensaje = getErrorMessage(falla);
      if ((falla instanceof ApiError && falla.status === 409) || esCorreoDuplicado(mensaje)) {
        const conCorreo: ErroresEspecialista = { correo: 'Este especialista ya está registrado con ese correo.' };
        setErrores(conCorreo);
        enfocarPrimerError(conCorreo);
        return;
      }
      setErrorGeneral(mensaje);
    }
  }

  return (
    <div className="flex flex-col items-center bg-white py-10 px-4 sm:py-16">
      {estado === 'exito' && creado ? (
        <div
          ref={exitoRef}
          tabIndex={-1}
          role="status"
          className="flex flex-col items-start bg-white w-full max-w-[560px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)] focus:outline-none"
        >
          <h1 className="text-slate-900 text-2xl font-bold">¡Especialista registrado!</h1>
          <p className="text-slate-700 text-sm">
            {creado.nombre} {creado.apellido} ya está habilitado en la plataforma y puede iniciar sesión con el correo{' '}
            <strong>{creado.correo}</strong> y la contraseña temporal que definiste. Compártesela por un medio seguro.
          </p>
          <button
            type="button"
            onClick={registrarOtro}
            className="self-stretch bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
          >
            Registrar otro especialista
          </button>
        </div>
      ) : (
        <form
          onSubmit={manejarEnvio}
          noValidate
          aria-busy={enviando}
          aria-labelledby="especialista-titulo"
          className="flex flex-col items-start bg-white w-full max-w-[560px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
        >
          <div className="flex flex-col gap-2">
            <h1 id="especialista-titulo" className="text-slate-900 text-2xl font-bold">
              Registrar especialista
            </h1>
            <p className="text-slate-500 text-sm">Solo administradores pueden registrar nuevos especialistas</p>
            <p className="text-slate-600 text-xs">Los campos marcados con * son obligatorios.</p>
          </div>

          {errorGeneral && (
            <p role="alert" className="self-stretch text-red-700 text-sm border border-red-700 rounded-lg p-3">
              {errorGeneral}
            </p>
          )}

          <FormField
            id="especialista-nombre"
            label="Nombre"
            value={valores.nombre}
            onChange={(valor) => cambiarValor('nombre', valor)}
            error={errores.nombre}
            placeholder="Ej. Carlos"
            required
            readOnly={enviando}
          />
          <FormField
            id="especialista-apellido"
            label="Apellido"
            value={valores.apellido}
            onChange={(valor) => cambiarValor('apellido', valor)}
            error={errores.apellido}
            placeholder="Ej. Ramírez"
            required
            readOnly={enviando}
          />
          <FormField
            id="especialista-correo"
            label="Correo electrónico"
            type="email"
            value={valores.correo}
            onChange={(valor) => cambiarValor('correo', valor)}
            error={errores.correo}
            placeholder="especialista@clinica.com"
            inputMode="email"
            required
            readOnly={enviando}
          />
          <FormField
            id="especialista-telefono"
            label="Teléfono"
            type="tel"
            value={valores.telefono}
            onChange={(valor) => cambiarValor('telefono', valor)}
            error={errores.telefono}
            hint="Entre 7 y 15 dígitos, sin espacios."
            inputMode="tel"
            readOnly={enviando}
          />
          <FormField
            id="especialista-registroMedico"
            label="Registro médico"
            value={valores.registroMedico}
            onChange={(valor) => cambiarValor('registroMedico', valor)}
            error={errores.registroMedico}
            readOnly={enviando}
          />
          <FormField
            id="especialista-contrasena"
            label="Contraseña temporal"
            type="password"
            value={valores.contrasena}
            onChange={(valor) => cambiarValor('contrasena', valor)}
            error={errores.contrasena}
            hint={`Mínimo ${MIN_CONTRASENA} caracteres. Con ella el especialista inicia sesión por primera vez.`}
            autoComplete="new-password"
            required
            readOnly={enviando}
          />

          <button
            type="submit"
            aria-disabled={enviando}
            className="self-stretch bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          >
            {enviando ? 'Registrando…' : 'Registrar especialista'}
          </button>
        </form>
      )}
    </div>
  );
}
