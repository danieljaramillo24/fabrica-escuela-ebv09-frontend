import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { getErrorMessage } from '../services/api';

interface EstadoCarga<T> {
  cargando: boolean;
  datos: T | null;
  /** Mensaje ya en lenguaje humano */
  error: string | null;
}

/**
 * Carga datos al montar la pantalla (o cuando cambian las dependencias) y expone los tres
 * estados que toda lista debe mostrar: cargando, error y datos. `recargar` reintenta.
 * La petición se cancela si la pantalla se desmonta o si se vuelve a cargar.
 */
export function useCargaDatos<T>(cargar: (signal: AbortSignal) => Promise<T>, dependencias: DependencyList = []) {
  const [estado, setEstado] = useState<EstadoCarga<T>>({ cargando: true, datos: null, error: null });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    setEstado((previo) => ({ ...previo, cargando: true, error: null }));

    cargar(controlador.signal)
      .then((datos) => {
        if (!controlador.signal.aborted) setEstado({ cargando: false, datos, error: null });
      })
      .catch((error: unknown) => {
        if (controlador.signal.aborted) return;
        setEstado({ cargando: false, datos: null, error: getErrorMessage(error) });
      });

    return () => controlador.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, intento]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  return { ...estado, recargar };
}
