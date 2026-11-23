import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import BotonOpcion from '../../components/BotonOpcion';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { ApiError, getErrorMessage } from '../../services/api';
import { actualizarEspecialista, listarEspecialistas } from '../../services/especialistas.service';
import type { Especialista } from '../../types/especialista';
import { esCorreoDuplicado, tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_EDICION_ESPECIALISTA,
  construirActualizacionEspecialista,
  esCampoEdicionEspecialista,
  hayCambiosEnEspecialista,
  validarEdicionEspecialista,
  valoresDesdeEspecialista,
  type CampoEdicionEspecialista,
  type ErroresEdicionEspecialista,
  type ValoresEdicionEspecialista,
} from './validacion';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

// HU-21 — Editar especialista: GET /api/especialistas y PUT /api/especialistas/{id}. Solo
// ROLE_ADMIN: la ruta la protege <ProtectedRoute> y el servidor vuelve a comprobarlo (HU-24).
// No cambia la contraseña ni el rol de la cuenta.
export default function HU21EditarEspecialista() {
  useTitulo('Editar especialista');

  const { datos, cargando, error, recargar } = useCargaDatos(listarEspecialistas);
  const [idElegido, setIdElegido] = useState<number | null>(null);

  const elegido = (datos ?? []).find((e) => e.idUsuario === idElegido) ?? (datos ?? [])[0] ?? null;

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[760px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Editar especialista</h1>
        <p className="text-slate-500 text-sm">Mantén actualizados los datos de los especialistas registrados</p>
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

      {datos && !cargando && datos.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-slate-100 p-6">
          <p className="text-slate-900 text-base font-medium">Aún no hay especialistas registrados.</p>
          <Link to={RUTAS.registrarEspecialista} className={BOTON_PRIMARIO}>
            Registrar un especialista
          </Link>
        </div>
      )}

      {datos && datos.length > 1 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-slate-900 text-sm font-bold">Especialista a editar</h2>
          <div className="flex flex-wrap gap-2.5">
            {datos.map((e) => (
              <BotonOpcion
                key={e.idUsuario}
                seleccionado={e.idUsuario === elegido?.idUsuario}
                onClick={() => setIdElegido(e.idUsuario)}
              >
                {e.nombre} {e.apellido}
              </BotonOpcion>
            ))}
          </div>
        </div>
      )}

      {elegido && <FormularioEdicion key={elegido.idUsuario} inicial={elegido} alGuardar={recargar} />}
    </div>
  );
}

function FormularioEdicion({ inicial, alGuardar }: { inicial: Especialista; alGuardar: () => void }) {
  const { cerrarSesion } = useAuth();
  const [guardado, setGuardado] = useState<ValoresEdicionEspecialista>(() => valoresDesdeEspecialista(inicial));
  const [valores, setValores] = useState<ValoresEdicionEspecialista>(guardado);
  const [errores, setErrores] = useState<ErroresEdicionEspecialista>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);

  const hayCambios = hayCambiosEnEspecialista(valores, guardado);

  function cambiarValor(campo: CampoEdicionEspecialista, valor: string) {
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

  function enfocarPrimerError(conErrores: ErroresEdicionEspecialista) {
    const primero = CAMPOS_EDICION_ESPECIALISTA.find((campo) => conErrores[campo]);
    if (primero) document.getElementById(`editar-especialista-${primero}`)?.focus();
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando || !hayCambios) return;
    setErrorGeneral(null);
    setConfirmacion(null);

    // Escenario 2: con datos incompletos o con mal formato no se guarda nada
    const erroresCliente = validarEdicionEspecialista(valores);
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
      const editado = await actualizarEspecialista(
        inicial.idUsuario,
        construirActualizacionEspecialista(valores),
        controlador.signal,
      );
      const nuevos = valoresDesdeEspecialista(editado);
      setGuardado(nuevos);
      setValores(nuevos);
      setConfirmacion('Cambios guardados. La información actualizada ya se muestra en toda la plataforma.');
      alGuardar();
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;
      if (falla instanceof ApiError && falla.status === 401) {
        cerrarSesion();
        return;
      }

      if (falla instanceof ApiError && tieneErrores(falla.fieldErrors)) {
        const delServidor: ErroresEdicionEspecialista = {};
        for (const [clave, mensaje] of Object.entries(falla.fieldErrors)) {
          if (esCampoEdicionEspecialista(clave)) delServidor[clave] = mensaje;
        }
        if (tieneErrores(delServidor)) {
          setErrores(delServidor);
          enfocarPrimerError(delServidor);
          return;
        }
      }

      // Escenario 3: el correo ya es de otra cuenta, no se permite el cambio
      const mensaje = getErrorMessage(falla);
      if ((falla instanceof ApiError && falla.status === 409) || esCorreoDuplicado(mensaje)) {
        const conCorreo: ErroresEdicionEspecialista = { correo: 'Ese correo ya está registrado en otra cuenta. Usa uno distinto.' };
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
      aria-labelledby="editar-especialista-titulo"
      className="flex flex-col items-start bg-white w-full p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="editar-especialista-titulo" className="text-slate-900 text-lg font-bold">
          {inicial.nombre} {inicial.apellido}
        </h2>
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
        id="editar-especialista-nombre"
        label="Nombre"
        value={valores.nombre}
        onChange={(valor) => cambiarValor('nombre', valor)}
        error={errores.nombre}
        required
        readOnly={enviando}
      />
      <FormField
        id="editar-especialista-apellido"
        label="Apellido"
        value={valores.apellido}
        onChange={(valor) => cambiarValor('apellido', valor)}
        error={errores.apellido}
        required
        readOnly={enviando}
      />
      <FormField
        id="editar-especialista-correo"
        label="Correo electrónico"
        type="email"
        value={valores.correo}
        onChange={(valor) => cambiarValor('correo', valor)}
        error={errores.correo}
        inputMode="email"
        required
        readOnly={enviando}
      />
      <FormField
        id="editar-especialista-telefono"
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
        id="editar-especialista-registroMedico"
        label="Registro médico"
        value={valores.registroMedico}
        onChange={(valor) => cambiarValor('registroMedico', valor)}
        error={errores.registroMedico}
        readOnly={enviando}
      />

      <button
        type="submit"
        aria-disabled={enviando || !hayCambios}
        className="self-stretch bg-[#1D6070] text-white text-[15px] font-semibold leading-[normal] py-3.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
      >
        {enviando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}
