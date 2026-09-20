import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RUTAS, rutaInicioPorRol } from './paths';

// "/" no muestra contenido: lleva a cada persona a su pantalla de inicio.
// Es lógica de enrutamiento, no una pantalla, por eso vive junto a `paths.ts`.
export default function Inicio() {
  const { sesion } = useAuth();
  return <Navigate to={sesion ? rutaInicioPorRol(sesion.rol) : RUTAS.login} replace />;
}
