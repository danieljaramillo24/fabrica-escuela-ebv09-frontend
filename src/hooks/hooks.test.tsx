import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import * as auth from '../services/auth.service';
import { SESION_USUARIO } from '../test/render';
import { useAuth } from './useAuth';
import { useCargaDatos } from './useCargaDatos';
import { useInactividad } from './useInactividad';
import { useTitulo } from './useTitulo';

describe('useTitulo', () => {
  it('cambia el título de la página', () => {
    renderHook(() => useTitulo('Mis citas'));
    expect(document.title).toBe('Mis citas — Vitalis');
  });
});

describe('useCargaDatos', () => {
  it('pasa de cargando a datos', async () => {
    const { result } = renderHook(() => useCargaDatos(() => Promise.resolve(['a'])));
    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.datos).toEqual(['a']);
    expect(result.current.error).toBeNull();
  });

  it('muestra el error en lenguaje humano y permite reintentar', async () => {
    let falla = true;
    const { result } = renderHook(() => useCargaDatos(() => (falla ? Promise.reject(new Error('x')) : Promise.resolve(1))));
    await waitFor(() => expect(result.current.error).toMatch(/error inesperado/));
    falla = false;
    act(() => result.current.recargar());
    await waitFor(() => expect(result.current.datos).toBe(1));
  });
});

describe('useInactividad', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('avisa al pasar el tiempo sin actividad', () => {
    const alExpirar = vi.fn();
    renderHook(() => useInactividad(true, 30, alExpirar));
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(alExpirar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60 * 1000 + 1);
    expect(alExpirar).toHaveBeenCalledOnce();
  });

  it('la actividad reinicia la cuenta', () => {
    const alExpirar = vi.fn();
    renderHook(() => useInactividad(true, 30, alExpirar));
    vi.advanceTimersByTime(20 * 60 * 1000);
    window.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(20 * 60 * 1000);
    expect(alExpirar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(alExpirar).toHaveBeenCalledOnce();
  });

  it('desactivado no cuenta', () => {
    const alExpirar = vi.fn();
    renderHook(() => useInactividad(false, 30, alExpirar));
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(alExpirar).not.toHaveBeenCalled();
  });
});

describe('AuthProvider', () => {
  afterEach(() => vi.restoreAllMocks());

  function Sonda() {
    const { sesion, verificando, avisoSesion, cerrarSesion, iniciarSesion } = useAuth();
    return (
      <div>
        <p>{verificando ? 'verificando' : sesion ? `sesión de ${sesion.nombre}` : 'sin sesión'}</p>
        <p>{avisoSesion ? `aviso: ${avisoSesion}` : 'sin aviso'}</p>
        <button onClick={() => cerrarSesion('Cerramos tu sesión por inactividad')}>cerrar</button>
        <button onClick={() => iniciarSesion(SESION_USUARIO)}>abrir</button>
      </div>
    );
  }

  it('recupera la sesión al abrir la aplicación preguntando al backend', async () => {
    vi.spyOn(auth, 'obtenerSesionActual').mockResolvedValue(SESION_USUARIO);
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    expect(screen.getByText('verificando')).toBeInTheDocument();
    expect(await screen.findByText('sesión de Ana')).toBeInTheDocument();
  });

  it('sin sesión en el servidor queda sin sesión', async () => {
    vi.spyOn(auth, 'obtenerSesionActual').mockResolvedValue(null);
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    expect(await screen.findByText('sin sesión')).toBeInTheDocument();
  });

  it('cerrar sesión avisa al servidor y guarda el motivo; iniciar sesión lo borra', async () => {
    vi.spyOn(auth, 'obtenerSesionActual').mockResolvedValue(SESION_USUARIO);
    const cerrar = vi.spyOn(auth, 'cerrarSesionEnServidor').mockResolvedValue();
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    await screen.findByText('sesión de Ana');
    act(() => screen.getByText('cerrar').click());
    expect(cerrar).toHaveBeenCalledOnce();
    expect(screen.getByText('sin sesión')).toBeInTheDocument();
    expect(screen.getByText('aviso: Cerramos tu sesión por inactividad')).toBeInTheDocument();
    act(() => screen.getByText('abrir').click());
    expect(screen.getByText('sin aviso')).toBeInTheDocument();
  });

  it('useAuth falla fuera del proveedor', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/dentro de <AuthProvider>/);
  });
});
