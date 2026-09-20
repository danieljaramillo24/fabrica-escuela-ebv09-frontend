import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RUTAS } from '../routes/paths';
import type { Rol } from '../types/auth';
import AccesoDenegado from './AccesoDenegado';

interface ProtectedRouteProps {
  /** Roles con acceso. Si se omite, basta con haber iniciado sesión. */
  roles?: Rol[];
  children: ReactNode;
}

// Es una ayuda de experiencia: la autorización real la verifica el servidor en cada petición.
export default function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { sesion } = useAuth();
  const ubicacion = useLocation();

  if (!sesion) {
    return <Navigate to={RUTAS.login} replace state={{ desde: ubicacion.pathname }} />;
  }
  if (roles && !roles.includes(sesion.rol)) return <AccesoDenegado />;

  return <>{children}</>;
}
