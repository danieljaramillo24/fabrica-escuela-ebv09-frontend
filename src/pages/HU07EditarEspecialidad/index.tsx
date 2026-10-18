import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import BotonOpcion from '../../components/BotonOpcion';
import FormField from '../../components/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { ApiError, getErrorMessage } from '../../services/api';
import { actualizarEspecialidad, listarEspecialidades } from '../../services/especialidades.service';
import type { Especialidad } from '../../types/especialidad';
import { tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_ESPECIALIDAD,
  MAX_DESCRIPCION,
  esCampoEspecialidad,
  validarEspecialidad,
  type CampoEspecialidad,
  type ErroresEspecialidad,
  type ValoresEspecialidad,
} from '../../utils/validacionEspecialidad';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

function valoresDesde(especialidad: Especialidad): ValoresEspecialidad {
  return {
    nombreEspecialidad: especialidad.nombreEspecialidad,
    descripcion: especialidad.descripcion,
    duracionMinutos: String(especialidad.duracionMinutos),
  };
}

// HU-07 — Editar especialidad: GET /api/especialidades (se muestran solo las del especialista de la
// sesión) y PUT /api/especialidades/{id}. Solo ROLE_ESPECIALISTA y solo sobre sus propias
// especialidades: el servidor lo vuelve a comprobar. Las citas ya confirmadas no se alteran.
export default function HU07EditarEspecialidad() {
  useTitulo('Editar especialidad');

  const { sesion } = useAuth();
  const { datos, cargando, error, recargar } = useCargaDatos(listarEspecialidades);
  const [idElegida, setIdElegida] = useState<number | null>(null);

  const propias = useMemo(
    () => (datos ?? []).filter((e) => e.especialista?.idUsuario === sesion?.idUsuario),
    [datos, sesion?.idUsuario],
  );
  const elegida = propias.find((e) => e.idEspecialidad === idElegida) ?? propias[0] ?? null;

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[760px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Editar especialidad</h1>
        <p className="text-slate-500 text-sm">Actualiza la información de tus consultas para mantener al día tu oferta de servicios</p>
      </div>

      {cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Cargando tus especialidades…
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

      {datos && !cargando && propias.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-slate-100 p-6">
          <p className="text-slate-900 text-base font-medium">Aún no tienes especialidades registradas.</p>
          <Link to={RUTAS.registrarEspecialidad} className={BOTON_PRIMARIO}>
            Registrar una especialidad
          </Link>
        </div>
      )}

      {propias.length > 1 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-slate-900 text-sm font-bold">Especialidad a editar</h2>
          <div className="flex flex-wrap gap-2.5">
            {propias.map((e) => (
              <BotonOpcion
                key={e.idEspecialidad}
                seleccionado={e.idEspecialidad === elegida?.idEspecialidad}
                onClick={() => setIdElegida(e.idEspecialidad)}
              >
                {e.nombreEspecialidad}
              </BotonOpcion>
            ))}
          </div>
        </div>
      )}

      {elegida && <FormularioEdicion key={elegida.idEspecialidad} inicial={elegida} alGuardar={recargar} />}
    </div>
  );
}

function FormularioEdicion({ inicial, alGuardar }: { inicial: Especialidad; alGuardar: () => void }) {
  const { cerrarSesion } = useAuth();
  const [guardada, setGuardada] = useState<ValoresEspecialidad>(() => valoresDesde(inicial));
  const [valores, setValores] = useState<ValoresEspecialidad>(guardada);
  const [errores, setErrores] = useState<ErroresEspecialidad>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);

  const duracionCambia = valores.duracionMinutos.trim() !== guardada.duracionMinutos;
  const hayCambios = CAMPOS_ESPECIALIDAD.some((campo) => valores[campo].trim() !== guardada[campo].trim());

  function cambiarValor(campo: CampoEspecialidad, valor: string) {
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

  function enfocarPrimerError(conErrores: ErroresEspecialidad) {
    const primero = CAMPOS_ESPECIALIDAD.find((campo) => conErrores[campo]);
    if (primero) document.getElementById(`editar-${primero}`)?.focus();
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando || !hayCambios) return;
    setErrorGeneral(null);
    setConfirmacion(null);

    const erroresCliente = validarEspecialidad(valores);
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
      const editada = await actualizarEspecialidad(
        inicial.idEspecialidad,
        {
          nombreEspecialidad: valores.nombreEspecialidad.trim(),
          descripcion: valores.descripcion.trim(),
          duracionMinutos: Number(valores.duracionMinutos.trim()),
        },
        controlador.signal,
      );
      const nuevos = valoresDesde(editada);
      setGuardada(nuevos);
      setValores(nuevos);
      setConfirmacion('Cambios guardados. La información actualizada ya se muestra en la plataforma.');
      alGuardar();
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;
      if (falla instanceof ApiError && falla.status === 401) {
        cerrarSesion();
        return;
      }
      if (falla instanceof ApiError && tieneErrores(falla.fieldErrors)) {
        const delServidor: ErroresEspecialidad = {};
        for (const [clave, mensaje] of Object.entries(falla.fieldErrors)) {
          if (esCampoEspecialidad(clave)) delServidor[clave] = mensaje;
        }
        if (tieneErrores(delServidor)) {
          setErrores(delServidor);
          enfocarPrimerError(delServidor);
          return;
        }
      }
      setErrorGeneral(getErrorMessage(falla));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      aria-busy={enviando}
      aria-labelledby="editar-titulo"
      className="flex flex-col items-start bg-white w-full p-6 sm:p-10 gap-5 rounded-xl shadow-[0px_8px_24px_rgba(15,23,41,0.08)]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="editar-titulo" className="text-slate-900 text-lg font-bold">
          {inicial.nombreEspecialidad}
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
        id="editar-nombreEspecialidad"
        label="Nombre de la especialidad"
        value={valores.nombreEspecialidad}
        onChange={(valor) => cambiarValor('nombreEspecialidad', valor)}
        error={errores.nombreEspecialidad}
        required
        readOnly={enviando}
      />
      <FormField
        id="editar-descripcion"
        label="Descripción"
        multiline
        rows={4}
        value={valores.descripcion}
        onChange={(valor) => cambiarValor('descripcion', valor)}
        error={errores.descripcion}
        hint={`Hasta ${MAX_DESCRIPCION} caracteres.`}
        required
        readOnly={enviando}
      />
      <FormField
        id="editar-duracionMinutos"
        label="Duración de la consulta (minutos)"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        value={valores.duracionMinutos}
        onChange={(valor) => cambiarValor('duracionMinutos', valor)}
        error={errores.duracionMinutos}
        required
        readOnly={enviando}
      />

      {duracionCambia && (
        <p role="status" className="self-stretch text-slate-900 text-sm border border-slate-500 rounded-lg p-3">
          Si ya hay citas futuras programadas, conservan su duración actual: el cambio aplica a las citas nuevas.
        </p>
      )}

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
