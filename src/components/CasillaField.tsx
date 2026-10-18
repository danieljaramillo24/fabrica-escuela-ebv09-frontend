import type { ReactNode } from 'react';

interface CasillaFieldProps {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: (marcada: boolean) => void;
  /** Mensaje de error (ya en lenguaje humano). Se anuncia a lectores de pantalla. */
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
}

// Casilla de verificación accesible: label asociado, error vinculado con aria-describedby,
// aria-invalid y foco visible. Pareja de FormField para opciones de sí/no.
export default function CasillaField({ id, label, checked, onChange, error, required = false, disabled = false }: CasillaFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col items-start self-stretch gap-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          required={required}
          onChange={(evento) => onChange(evento.target.checked)}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070]"
        />
        <label htmlFor={id} className="text-slate-900 text-[13px] leading-5">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-red-700 text-[13px]">
          {error}
        </p>
      )}
    </div>
  );
}
