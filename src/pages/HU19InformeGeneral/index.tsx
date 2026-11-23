import { useState, type FormEvent } from 'react';
import FormField from '../../components/FormField';
import { useCargaDatos } from '../../hooks/useCargaDatos';
import { useTitulo } from '../../hooks/useTitulo';
import { obtenerInformeGeneral } from '../../services/informes.service';
import type { InformeGeneral, RangoFechas } from '../../types/informe';
import { fechaNumerica } from '../../utils/fechas';
import { tieneErrores } from '../../utils/validaciones';
import {
  CAMPOS_RANGO,
  VALORES_INICIALES_RANGO,
  construirRango,
  validarRango,
  type ErroresRango,
  type ValoresRango,
} from './validacion';

const BOTON_PRIMARIO =
  'bg-[#1D6070] text-white text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';
const BOTON_SECUNDARIO =
  'text-[#1D6070] text-sm font-semibold leading-[normal] py-2.5 px-4 rounded-lg border border-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]';

// Cada total con su rótulo en texto: la información no depende del color
const TOTALES: { clave: keyof InformeGeneral; etiqueta: string }[] = [
  { clave: 'totalPacientes', etiqueta: 'Pacientes' },
  { clave: 'totalEspecialistas', etiqueta: 'Especialistas' },
  { clave: 'citasProgramadas', etiqueta: 'Citas programadas' },
  { clave: 'citasCanceladas', etiqueta: 'Citas canceladas' },
  { clave: 'citasRealizadas', etiqueta: 'Citas realizadas' },
];

function descripcionPeriodo({ desde, hasta }: RangoFechas): string {
  if (desde && hasta) return `del ${fechaNumerica(desde)} al ${fechaNumerica(hasta)}`;
  if (desde) return `desde el ${fechaNumerica(desde)}`;
  if (hasta) return `hasta el ${fechaNumerica(hasta)}`;
  return 'de todo el historial';
}

// Sin citas en el periodo (escenario 3): los totales de personas no dependen de las fechas
const sinCitas = (i: InformeGeneral) => i.citasProgramadas + i.citasCanceladas + i.citasRealizadas === 0;

// HU-19 — Informe general: GET /api/informes/general?desde=…&hasta=…. Solo ROLE_ADMIN: la ruta la
// protege <ProtectedRoute> y el servidor vuelve a comprobarlo (HU-24). El filtro por fechas
// actualiza las cifras al aplicarlo.
export default function HU19InformeGeneral() {
  useTitulo('Informe general');

  const [valores, setValores] = useState<ValoresRango>(VALORES_INICIALES_RANGO);
  const [errores, setErrores] = useState<ErroresRango>({});
  const [aplicado, setAplicado] = useState<RangoFechas>({});

  const { datos, cargando, error, recargar } = useCargaDatos(
    (signal) => obtenerInformeGeneral(aplicado, signal),
    [aplicado.desde, aplicado.hasta],
  );

  function cambiarValor(campo: keyof ValoresRango, valor: string) {
    setValores((previo) => ({ ...previo, [campo]: valor }));
    setErrores({});
  }

  function aplicarFiltro(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const erroresCliente = validarRango(valores);
    if (tieneErrores(erroresCliente)) {
      setErrores(erroresCliente);
      const primero = CAMPOS_RANGO.find((campo) => erroresCliente[campo]);
      if (primero) document.getElementById(`informe-${primero}`)?.focus();
      return;
    }
    setErrores({});
    setAplicado(construirRango(valores));
  }

  function quitarFiltro() {
    setValores(VALORES_INICIALES_RANGO);
    setErrores({});
    setAplicado({});
  }

  const hayFiltro = Boolean(aplicado.desde || aplicado.hasta);

  return (
    <div className="flex flex-col gap-6 bg-white py-10 px-4 sm:px-12 sm:py-12 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 text-2xl font-bold">Informe general</h1>
        <p className="text-slate-500 text-sm">Supervisa el funcionamiento de la clínica: pacientes, especialistas y citas</p>
      </div>

      <form
        onSubmit={aplicarFiltro}
        noValidate
        aria-labelledby="informe-filtro-titulo"
        className="flex flex-col gap-4 rounded-xl p-6 shadow-[0px_4px_16px_rgba(15,23,41,0.08)]"
      >
        <h2 id="informe-filtro-titulo" className="text-slate-900 text-base font-semibold">
          Filtrar por fechas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="informe-desde"
            label="Desde"
            type="date"
            value={valores.desde}
            onChange={(valor) => cambiarValor('desde', valor)}
            error={errores.desde}
          />
          <FormField
            id="informe-hasta"
            label="Hasta"
            type="date"
            value={valores.hasta}
            onChange={(valor) => cambiarValor('hasta', valor)}
            error={errores.hasta}
          />
        </div>
        <p className="text-slate-600 text-xs">Déjalas vacías para ver todo el historial.</p>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={BOTON_PRIMARIO}>
            Aplicar filtro
          </button>
          {(hayFiltro || valores.desde || valores.hasta) && (
            <button type="button" onClick={quitarFiltro} className={BOTON_SECUNDARIO}>
              Quitar filtro
            </button>
          )}
        </div>
      </form>

      {cargando && (
        <p role="status" className="text-slate-600 text-sm">
          Calculando el informe…
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

      {datos && !cargando && (
        <section aria-labelledby="informe-resultado" className="flex flex-col gap-4">
          <h2 id="informe-resultado" className="text-slate-900 text-base font-semibold">
            Resumen {descripcionPeriodo(aplicado)}
          </h2>

          {sinCitas(datos) && (
            <p role="status" className="text-slate-700 text-sm rounded-lg bg-slate-100 p-4">
              No hay citas registradas en este periodo. Prueba con otro rango de fechas o quita el filtro.
            </p>
          )}

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOTALES.map(({ clave, etiqueta }) => (
              <div key={clave} className="flex flex-col gap-1 rounded-xl p-6 shadow-[0px_8px_24px_rgba(15,23,41,0.08)]">
                <dt className="text-slate-600 text-sm font-medium">{etiqueta}</dt>
                <dd className="text-slate-900 text-3xl font-bold">{datos[clave]}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
