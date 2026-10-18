import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useInactividad } from '../hooks/useInactividad';
import { cerrarSesionEnServidor, obtenerSesionActual } from '../services/auth.service';
import type { Sesion } from '../types/auth';

// HU-25: la sesión se cierra tras 30 minutos sin actividad
export const MINUTOS_INACTIVIDAD = 30;
const AVISO_INACTIVIDAD = 'Cerramos tu sesión por inactividad. Inicia sesión de nuevo para continuar.';

interface AuthContextValue {
  /** Sesión iniciada, o null si no hay */
  sesion: Sesion | null;
  /** true mientras se pregunta al backend si hay una sesión abierta (al abrir o recargar la app) */
  verificando: boolean;
  /** Motivo por el que se cerró la sesión sin que la persona lo pidiera; lo muestra el inicio de sesión */
  avisoSesion: string | null;
  iniciarSesion: (sesion: Sesion) => void;
  /** Cierra la sesión en la interfaz y en el servidor (HU-26) */
  cerrarSesion: (aviso?: string) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// La sesión es una cookie HttpOnly: aquí solo vive en memoria quién es la persona. No se guarda
// nada en el navegador; al recargar se vuelve a preguntar al backend (ver services/sesion.ts).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [avisoSesion, setAvisoSesion] = useState<string | null>(null);
  const hayVerificacionActual = useRef(false);

  useEffect(() => {
    const controlador = new AbortController();
    obtenerSesionActual(controlador.signal)
      .then((actual) => {
        // Si la persona inició sesión mientras tanto, esa respuesta es la más reciente
        if (!controlador.signal.aborted && !hayVerificacionActual.current) setSesion(actual);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controlador.signal.aborted) setVerificando(false);
      });
    return () => controlador.abort();
  }, []);

  // HU-26: al volver con el botón "atrás" el navegador puede restaurar la página desde su caché
  // con la sesión ya cerrada. Se vuelve a preguntar al backend para no mostrar datos de más.
  useEffect(() => {
    const alMostrar = (evento: PageTransitionEvent) => {
      if (!evento.persisted) return;
      obtenerSesionActual()
        .then(setSesion)
        .catch(() => undefined);
    };
    window.addEventListener('pageshow', alMostrar);
    return () => window.removeEventListener('pageshow', alMostrar);
  }, []);

  const iniciarSesion = useCallback((nueva: Sesion) => {
    hayVerificacionActual.current = true;
    setAvisoSesion(null);
    setSesion(nueva);
  }, []);

  const cerrarSesion = useCallback((aviso?: string) => {
    hayVerificacionActual.current = true;
    setSesion(null);
    setAvisoSesion(aviso ?? null);
    void cerrarSesionEnServidor();
  }, []);

  useInactividad(sesion !== null, MINUTOS_INACTIVIDAD, () => cerrarSesion(AVISO_INACTIVIDAD));

  const valor = useMemo(
    () => ({ sesion, verificando, avisoSesion, iniciarSesion, cerrarSesion }),
    [sesion, verificando, avisoSesion, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
