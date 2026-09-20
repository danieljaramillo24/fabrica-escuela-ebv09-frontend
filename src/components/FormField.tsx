import type { HTMLInputTypeAttribute, ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: HTMLInputTypeAttribute;
  /** Mensaje de error (ya en lenguaje humano). Se anuncia a lectores de pantalla. */
  error?: ReactNode;
  /** Ayuda opcional, asociada al campo con aria-describedby */
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  required?: boolean;
  /** Solo lectura (p. ej. mientras se envía): a diferencia de `disabled`, conserva el foco del teclado */
  readOnly?: boolean;
  disabled?: boolean;
  maxLength?: number;
}

// Campo de formulario accesible (WCAG 2.2 AA): label asociado, error y ayuda
// vinculados con aria-describedby, aria-invalid y foco visible.
export default function FormField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  placeholder,
  autoComplete,
  inputMode,
  required = false,
  readOnly = false,
  disabled = false,
  maxLength,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col items-start self-stretch gap-1.5">
      <label htmlFor={id} className="text-slate-900 text-[13px] font-medium leading-[normal]">
        {label}
        {required ? (
          <span aria-hidden="true"> *</span>
        ) : (
          <span className="text-slate-600 font-normal"> (opcional)</span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={[
          'self-stretch w-full bg-white text-slate-900 text-sm leading-[normal] py-3 px-3.5 rounded-lg border border-solid',
          'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1D6070]',
          'read-only:bg-slate-100 read-only:text-slate-700',
          'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
          error ? 'border-red-700' : 'border-slate-500 focus:border-[#1D6070]',
        ].join(' ')}
      />
      {hint && (
        <p id={hintId} className="text-slate-600 text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-red-700 text-[13px]">
          {error}
        </p>
      )}
    </div>
  );
}
