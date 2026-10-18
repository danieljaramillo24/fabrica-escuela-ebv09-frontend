import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SESION_ESPECIALISTA, SESION_USUARIO, renderConSesion } from '../test/render';
import BotonOpcion from './BotonOpcion';
import CasillaField from './CasillaField';
import DialogoConfirmacion from './DialogoConfirmacion';
import FormField from './FormField';
import ProtectedRoute from './ProtectedRoute';

describe('FormField', () => {
  it('asocia el label, marca los obligatorios y avisa del error', async () => {
    const alCambiar = vi.fn();
    render(<FormField id="c" label="Correo" value="" onChange={alCambiar} required error="Revisa el correo" hint="Ayuda" />);
    const campo = screen.getByLabelText(/Correo/);
    expect(campo).toBeRequired();
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Ayuda Revisa el correo');
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa el correo');
    await userEvent.type(campo, 'a');
    expect(alCambiar).toHaveBeenCalledWith('a');
  });

  it('indica que un campo es opcional', () => {
    render(<FormField id="t" label="Teléfono" value="" onChange={() => undefined} />);
    expect(screen.getByText('(opcional)')).toBeInTheDocument();
  });
});

describe('CasillaField', () => {
  it('se marca y muestra su error', async () => {
    const alCambiar = vi.fn();
    render(<CasillaField id="a" label="Autorizo" checked={false} onChange={alCambiar} required error="Acepta para continuar" />);
    const casilla = screen.getByRole('checkbox', { name: /Autorizo/ });
    expect(casilla).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Acepta para continuar');
    await userEvent.click(casilla);
    expect(alCambiar).toHaveBeenCalledWith(true);
  });
});

describe('BotonOpcion', () => {
  it('anuncia si está elegido y responde al clic', async () => {
    const alPulsar = vi.fn();
    render(
      <BotonOpcion seleccionado onClick={alPulsar}>
        Cardiología
      </BotonOpcion>,
    );
    const boton = screen.getByRole('button', { name: 'Cardiología' });
    expect(boton).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(boton);
    expect(alPulsar).toHaveBeenCalledOnce();
  });
});

describe('DialogoConfirmacion', () => {
  const props = { titulo: '¿Cancelar?', descripcion: 'No se puede deshacer', textoConfirmar: 'Sí', textoCancelar: 'No' };

  it('se abre, confirma y cancela', async () => {
    const alConfirmar = vi.fn();
    const alCancelar = vi.fn();
    render(<DialogoConfirmacion {...props} onConfirmar={alConfirmar} onCancelar={alCancelar} />);
    const dialogo = screen.getByRole('dialog', { name: '¿Cancelar?' });
    expect(dialogo).toHaveAccessibleDescription('No se puede deshacer');
    await userEvent.click(screen.getByRole('button', { name: 'Sí' }));
    await userEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(alConfirmar).toHaveBeenCalledOnce();
    expect(alCancelar).toHaveBeenCalledOnce();
  });

  it('Esc cancela, salvo que haya una petición en curso', () => {
    const alCancelar = vi.fn();
    const { rerender } = render(<DialogoConfirmacion {...props} onConfirmar={() => undefined} onCancelar={alCancelar} />);
    const dialogo = screen.getByRole('dialog', { name: '¿Cancelar?' });
    dialogo.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(alCancelar).toHaveBeenCalledOnce();
    rerender(<DialogoConfirmacion {...props} enviando onConfirmar={() => undefined} onCancelar={alCancelar} />);
    dialogo.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(alCancelar).toHaveBeenCalledOnce();
  });

  it('muestra el error del servidor dentro del diálogo', () => {
    render(<DialogoConfirmacion {...props} error="La cita ya fue cancelada" onConfirmar={() => undefined} onCancelar={() => undefined} />);
    expect(screen.getByRole('alert')).toHaveTextContent('La cita ya fue cancelada');
  });
});

describe('ProtectedRoute', () => {
  const protegida = (roles?: ('ROLE_USUARIO' | 'ROLE_ESPECIALISTA' | 'ROLE_ADMIN')[]) => (
    <Routes>
      <Route path="/login" element={<p>Pantalla de login</p>} />
      <Route
        path="/privada"
        element={
          <ProtectedRoute roles={roles}>
            <p>Contenido privado</p>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
  const pintar = (sesion: typeof SESION_USUARIO | null, roles?: Parameters<typeof protegida>[0], verificando = false) =>
    renderConSesion(protegida(roles), { sesion, verificando, ruta: '/privada' });

  it('mientras verifica la sesión muestra un estado de carga', () => {
    pintar(null, undefined, true);
    expect(screen.getByRole('status')).toHaveTextContent('Verificando tu sesión');
  });

  it('sin sesión lleva al login', () => {
    pintar(null);
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('con otro rol muestra acceso restringido (403) y no el contenido', () => {
    pintar(SESION_USUARIO, ['ROLE_ESPECIALISTA']);
    expect(screen.getByText('No tienes acceso a esta página')).toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('con el rol correcto muestra el contenido', () => {
    pintar(SESION_ESPECIALISTA, ['ROLE_ESPECIALISTA']);
    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });
});
