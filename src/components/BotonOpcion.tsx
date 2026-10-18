import type { ReactNode } from 'react';

interface BotonOpcionProps {
  /** Opción elegida: se anuncia con aria-pressed y se distingue también por color */
  seleccionado: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

// Botón de opción para elegir una entre varias (especialidad, horario). Del prototipo "chip" y
// "slot" de Vitalis; el estado elegido lo conocen también los lectores de pantalla.
export default function BotonOpcion({ seleccionado, onClick, children, disabled = false }: BotonOpcionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={seleccionado}
      className={[
        'text-sm font-medium leading-[normal] py-2.5 px-4 rounded-lg border border-solid',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        seleccionado
          ? 'bg-[#1D6070] border-[#1D6070] text-white'
          : 'bg-white border-slate-500 text-slate-900 hover:border-[#1D6070]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
