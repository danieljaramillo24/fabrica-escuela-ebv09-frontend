import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DialogoConfirmacion from '../../components/DialogoConfirmacion';
import { useAuth } from '../../hooks/useAuth';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { RUTAS } from '../../routes/paths';
import { ApiError, getErrorMessage } from '../../services/api';
import { bloquearHorario, desbloquearHorario, listarHorariosDeEspecialista } from '../../services/horarios.service';
import type { Horario } from '../../types/horario';
import { CLASE_ESTADO_HORARIO, ETIQUETA_ESTADO_HORARIO } from '../../utils/agenda';
import { fechaCorta, hoyISO, hora12 } from '../../utils/fechas';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';
const ACCION_TABLA =
  'text-[#1D6070] text-[13px] font-semibold underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] disabled:opacity-60 disabled:cursor-not-allowed';

// HU-11 — Bloquear horario: PUT /api/horarios/{id}/bloquear y /desbloquear. Solo ROLE_ESPECIALISTA
// y solo sobre su propia agenda (el servidor lo comprueba). Un horario con cita reservada no se
// puede bloquear: primero hay que cancelar o reprogramar la cita. Los tres estados se distinguen
// por texto y color: disponible, reservado y bloqueado.
export default function HU11BloquearHorario() {
  useTitulo('Gestión de agenda');

  const { sesion, cerrarSesion } = useAuth();
  const idEspecialista = sesion?.idUsuario;
  const { datos, cargando, error, recargar } = useCargaDatos(
    (signal) => (idEspecialista === undefined ? Promise.resolve([]) : listarHorariosDeEspecialista(idEspecialista, signal)),
    [idEspecialista],
  );

  const [porBloquear, setPorBloquear] = useState<Horario | null>(null);
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const controladorRef = useRef<AbortController | null>(null);
  const hoy = hoyISO();

  useEffect(() => () => controladorRef.current?.abort(), []);

  const ordenados = useMemo(
    () => [...(datos ?? [])].sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`)),
    [datos],
  );

  async function cambiar(horario: Horario, accion: 'bloquear' | 'desbloquear') {
    if (enviando) return;
    setErrorGeneral(null);
    setErrorDialogo(null);
    setConfirmacion(null);

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEnviando(true);

    try {
      await (accion === 'bloquear' ? bloquearHorario : desbloquearHorario)(horario.idHorario, controlador.signal);
      setPorBloquear(null);
      setConfirmacion(
        accion === 'bloquear'
          ? 'Horario bloqueado: ya no se ofrece a los pacientes.'
          : 'Horario liberado: vuelve a estar disponible para los pacientes.',
      );
      recargar();
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;
      if (falla instanceof ApiError && falla.status === 401) {
        cerrarSesion();
        return;
      }
      const mensaje = getErrorMessage(falla);
      // Si el servidor rechaza el cambio (p. ej. 409 por cita reservada) la lista pudo quedar vieja
      if (falla instanceof ApiError && falla.status === 409) recargar();
      if (accion === 'bloquear') setErrorDialogo(mensaje);
      else setErrorGeneral(mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Gestión de agenda</h1>
        <p className="text-slate-500 text-sm">Bloquea o libera horarios según tu disponibilidad</p>
        <p className="text-slate-600 text-xs">
          Un horario con cita reservada no se puede bloquear hasta que la cita se cancele o se reprograme. ¿Necesitas
          agregar horarios?{' '}
          <Link to={RUTAS.horarios} className="text-[#1D6070] underline font-medium">
            Ir a Mi agenda
          </Link>
          .
        </p>
      </div>

      {confirmacion && (
        <p role="status" className="text-green-800 text-sm border border-green-800 rounded-lg p-3">
          {confirmacion}
        </p>
      )}
      {errorGeneral && (
        <p role="alert" className="text-red-700 text-sm border border-red-700 rounded-lg p-3">
          {errorGeneral}
        </p>
      )}

      {cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Cargando tu agenda…
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

      {datos && !cargando && ordenados.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-slate-100 p-6">
          <p className="text-slate-900 text-base font-medium">Aún no tienes horarios registrados.</p>
          <Link to={RUTAS.horarios} className={BOTON_PRIMARIO}>
            Definir horarios
          </Link>
        </div>
      )}

      {ordenados.length > 0 && (
        <section aria-labelledby="horarios-registrados" className="flex flex-col gap-3">
          <h2 id="horarios-registrados" className="text-slate-900 text-base font-semibold">
            Horarios registrados
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-300">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Horarios de tu agenda, con su estado y la acción disponible</caption>
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Horario</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((horario) => {
                  const futuro = horario.fecha >= hoy;
                  const descripcion = `${fechaCorta(horario.fecha)}, ${hora12(horario.horaInicio)} a ${hora12(horario.horaFin)}`;
                  return (
                    <tr key={horario.idHorario} className="border-t border-slate-300">
                      <td className="px-4 py-3 text-slate-900 font-medium">{fechaCorta(horario.fecha)}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {hora12(horario.horaInicio)} – {hora12(horario.horaFin)}
                      </td>
                      <td className={`px-4 py-3 font-medium ${CLASE_ESTADO_HORARIO[horario.estado]}`}>
                        {ETIQUETA_ESTADO_HORARIO[horario.estado]}
                      </td>
                      <td className="px-4 py-3">
                        {horario.estado === 'LIBRE' && futuro && (
                          <button
                            type="button"
                            aria-label={`Bloquear horario ${descripcion}`}
                            onClick={() => {
                              setErrorDialogo(null);
                              setPorBloquear(horario);
                            }}
                            disabled={enviando}
                            className={ACCION_TABLA}
                          >
                            Bloquear
                          </button>
                        )}
                        {horario.estado === 'BLOQUEADO' && futuro && (
                          <button
                            type="button"
                            aria-label={`Liberar horario ${descripcion}`}
                            onClick={() => cambiar(horario, 'desbloquear')}
                            disabled={enviando}
                            className={ACCION_TABLA}
                          >
                            Liberar
                          </button>
                        )}
                        {horario.estado === 'RESERVADO' && <span className="text-slate-600 text-[13px]">Con cita reservada</span>}
                        {!futuro && horario.estado !== 'RESERVADO' && <span className="text-slate-600 text-[13px]">Fecha pasada</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {porBloquear && (
        <DialogoConfirmacion
          titulo="¿Bloquear este horario?"
          descripcion="Dejará de ofrecerse a los pacientes hasta que lo liberes."
          textoConfirmar="Sí, bloquear"
          textoCancelar="Mantener disponible"
          enviando={enviando}
          error={errorDialogo}
          onConfirmar={() => cambiar(porBloquear, 'bloquear')}
          onCancelar={() => setPorBloquear(null)}
        >
          <p>
            {fechaCorta(porBloquear.fecha)} · {hora12(porBloquear.horaInicio)} – {hora12(porBloquear.horaFin)}
          </p>
        </DialogoConfirmacion>
      )}
    </div>
  );
}
