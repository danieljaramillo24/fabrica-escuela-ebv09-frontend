import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { borrarSesion, guardarSesion, leerSesionGuardada } from '../services/sesion';
import type { Sesion } from '../types/auth';

interface AuthContextValue {
  /** Sesión iniciada, o null si no hay */
  sesion: Sesion | null;
  iniciarSesion: (sesion: Sesion) => void;
  cerrarSesion: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesionGuardada());

  const iniciarSesion = useCallback((nueva: Sesion) => {
    guardarSesion(nueva);
    setSesion(nueva);
  }, []);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    setSesion(null);
  }, []);

  const valor = useMemo(() => ({ sesion, iniciarSesion, cerrarSesion }), [sesion, iniciarSesion, cerrarSesion]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
