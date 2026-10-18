import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import type { Sesion } from '../types/auth';

export const SESION_USUARIO: Sesion = { idUsuario: 201, nombre: 'Ana', rol: 'ROLE_USUARIO' };
export const SESION_ESPECIALISTA: Sesion = { idUsuario: 101, nombre: 'Carlos', rol: 'ROLE_ESPECIALISTA' };
export const SESION_ADMIN: Sesion = { idUsuario: 1, nombre: 'Admin', rol: 'ROLE_ADMIN' };

interface Opciones {
  sesion?: Sesion | null;
  ruta?: string;
  verificando?: boolean;
  avisoSesion?: string | null;
}

/** Pinta una pantalla con la sesión indicada y un router en memoria. Devuelve los espías del contexto. */
export function renderConSesion(ui: ReactElement, { sesion = SESION_USUARIO, ruta = '/', verificando = false, avisoSesion = null }: Opciones = {}) {
  const contexto = { sesion, verificando, avisoSesion, iniciarSesion: vi.fn(), cerrarSesion: vi.fn() };
  const resultado = render(
    <AuthContext.Provider value={contexto}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { ...resultado, contexto };
}
