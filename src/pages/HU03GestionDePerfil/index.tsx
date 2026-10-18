import { useEffect, useRef, useState, type FormEvent } from 'react';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { ApiError, getErrorMessage } from '../../services/api';
import { actualizarPerfil, obtenerPerfil } from '../../services/usuarios.service';
import type { Perfil } from '../../types/usuario';
import { esCorreoDuplicado, tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_PERFIL,
  construirSolicitudPerfil,
  esCampoPerfil,
  sinCambios,
  validarPerfil,
  valoresDesdePerfil,
  type CampoPerfil,
  type ErroresPerfil,
  type ValoresPerfil,
} from './validacion';

// HU-03 — Gestión de perfil: GET y PUT /api/usuarios/{id}. Cualquier rol con sesión, pero solo
// sobre sus propios datos: el id sale de la sesión y el servidor vuelve a comprobarlo.
export default function HU03GestionDePerfil() {
  useTitulo('Mi perfil');

  const { sesion } = useAuth();
  const idUsuario = sesion?.idUsuario;
  const { datos, cargando, error, recargar } = useCargaDatos(
    (signal) => (idUsuario === undefined ? Promise.reject(new ApiError(401, '')) : obtenerPerfil(idUsuario, signal)),
    [idUsuario],
  );

  return (
    <div className="flex flex-col items-center bg-white py-10 px-4 sm:py-16">
      {cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Cargando tus datos…
        </p>
      )}
      {error && (
        <div className="flex flex-col items-start gap-3 w-full max-w-[560px] border border-red-700 rounded-lg p-4">
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
      {datos && !cargando && <FormularioPerfil key={datos.idUsuario} inicial={datos} />}
    </div>
  );
}

function FormularioPerfil({ inicial }: { inicial: Perfil }) {
  const { sesion, iniciarSesion, cerrarSesion } = useAuth();
  const [guardado, setGuardado] = useState<ValoresPerfil>(() => valoresDesdePerfil(inicial));
  const [valores, setValores] = useState<ValoresPerfil>(guardado);
  const [errores, setErrores] = useState<ErroresPerfil>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);

  const hayCambios = !sinCambios(valores, guardado);

  function cambiarValor(campo: CampoPerfil, valor: string) {
    setValores((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => {
      if (!previo[campo]) return previo;
      const siguiente = { ...previo };
      delete siguiente[campo];
      return siguiente;
    });
    setErrorGeneral(null);
    setConfirmacion(null);
  }

  function enfocarPrimerError(conErrores: ErroresPerfil) {
    const primero = CAMPOS_PERFIL.find((campo) => conErrores[campo]);
    if (primero) document.getElementById(`perfil-${primero}`)?.focus();
  }

  function descartar() {
    setValores(guardado);
    setErrores({});
    setErrorGeneral(null);
    setConfirmacion(null);
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setErrorGeneral(null);
    setConfirmacion(null);

    const erroresCliente = validarPerfil(valores);
    if (tieneErrores(erroresCliente)) {
      setErrores(erroresCliente);
      enfocarPrimerError(erroresCliente);
      return;
    }
    setErrores({});

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEnviando(true);

    try {
      const actualizado = await actualizarPerfil(inicial.idUsuario, construirSolicitudPerfil(valores), controlador.signal);
      const nuevos = valoresDesdePerfil(actualizado);
      setGuardado(nuevos);
      setValores(nuevos);
      setConfirmacion('Datos actualizados correctamente.');
      // El saludo de la cabecera usa el nombre de la sesión: se mantiene al día
      if (sesion) iniciarSesion({ ...sesion, nombre: actualizado.nombre });
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;

      // Sesión vencida o inválida: se cierra y <ProtectedRoute> lleva a iniciar sesión de nuevo
      if (falla instanceof ApiError && falla.status === 401) {
        cerrarSesion();
        return;
      }

      if (falla instanceof ApiError && tieneErrores(falla.fieldErrors)) {
        const delServidor: ErroresPerfil = {};
        for (const [clave, mensaje] of Object.entries(falla.fieldErrors)) {
          if (esCampoPerfil(clave)) delServidor[clave] = mensaje;
        }
        if (tieneErrores(delServidor)) {
          setErrores(delServidor);
          enfocarPrimerError(delServidor);
          return;
        }
      }

      const mensaje = getErrorMessage(falla);
      if (esCorreoDuplicado(mensaje)) {
        const conCorreo: ErroresPerfil = { correo: 'Ya existe una cuenta con este correo.' };
        setErrores(conCorreo);
        enfocarPrimerError(conCorreo);
        return;
      }
      setErrorGeneral(mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      aria-busy={enviando}
      aria-labelledby="perfil-titulo"
      className="flex flex-col items-start bg-white w-full max-w-[560px] p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
    >
      <div className="flex flex-col gap-2">
        <h1 id="perfil-titulo" className="text-slate-900 text-2xl font-bold">
          Mi perfil
        </h1>
        <p className="text-slate-500 text-sm">Consulta y actualiza tus datos personales</p>
        <p className="text-slate-600 text-xs">Los campos marcados con * son obligatorios.</p>
      </div>

      {errorGeneral && (
        <p role="alert" className="self-stretch text-red-700 text-sm border border-red-700 rounded-lg p-3">
          {errorGeneral}
        </p>
      )}
      {confirmacion && (
        <p role="status" className="self-stretch text-green-800 text-sm border border-green-800 rounded-lg p-3">
          {confirmacion}
        </p>
      )}

      <FormField
        id="perfil-nombre"
        label="Nombre"
        value={valores.nombre}
        onChange={(valor) => cambiarValor('nombre', valor)}
        error={errores.nombre}
        autoComplete="given-name"
        required
        readOnly={enviando}
      />
      <FormField
        id="perfil-apellido"
        label="Apellido"
        value={valores.apellido}
        onChange={(valor) => cambiarValor('apellido', valor)}
        error={errores.apellido}
        autoComplete="family-name"
        required
        readOnly={enviando}
      />
      <FormField
        id="perfil-correo"
        label="Correo electrónico"
        type="email"
        value={valores.correo}
        onChange={(valor) => cambiarValor('correo', valor)}
        error={errores.correo}
        autoComplete="email"
        inputMode="email"
        required
        readOnly={enviando}
      />
      <FormField
        id="perfil-telefono"
        label="Teléfono"
        type="tel"
        value={valores.telefono}
        onChange={(valor) => cambiarValor('telefono', valor)}
        error={errores.telefono}
        hint="Entre 7 y 15 dígitos, sin espacios."
        placeholder="Ej. 3001234567"
        autoComplete="tel"
        inputMode="tel"
        readOnly={enviando}
      />

      <div className="flex flex-wrap gap-4 self-stretch">
        <button
          type="submit"
          aria-disabled={enviando || !hayCambios}
          className="flex-1 bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 px-4 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          onClick={(evento) => {
            if (!hayCambios) evento.preventDefault();
          }}
        >
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={descartar}
          disabled={enviando || !hayCambios}
          className="flex-1 text-[#1D6070] text-[15px] font-semibold leading-[normal] py-3.5 px-4 rounded-lg border border-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
      <p className="text-slate-600 text-xs">Tus datos están protegidos y solo tú puedes modificarlos.</p>
    </form>
  );
}
