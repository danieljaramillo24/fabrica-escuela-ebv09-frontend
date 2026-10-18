import { useEffect, useRef, type ReactNode } from 'react';

interface DialogoConfirmacionProps {
  titulo: string;
  /** Texto que explica la consecuencia de la acción */
  descripcion: string;
  /** Datos de lo que se va a modificar (opcional) */
  children?: ReactNode;
  textoConfirmar: string;
  textoCancelar: string;
  /** Se muestra dentro del diálogo, por ejemplo si el servidor rechaza la acción */
  error?: string | null;
  enviando?: boolean;
  /** Acción que no se puede deshacer: el botón de confirmar va en rojo */
  peligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Diálogo modal accesible. Usa el elemento <dialog>: el navegador mantiene el foco dentro, cierra
// con Esc y devuelve el foco al botón que lo abrió. Se monta solo cuando hay algo que confirmar.
export default function DialogoConfirmacion({
  titulo,
  descripcion,
  children,
  textoConfirmar,
  textoCancelar,
  error,
  enviando = false,
  peligro = false,
  onConfirmar,
  onCancelar,
}: DialogoConfirmacionProps) {
  const dialogoRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
    return () => dialogo?.close();
  }, []);

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="dialogo-titulo"
      aria-describedby="dialogo-descripcion"
      // Esc: se cierra solo si no hay una petición en curso
      onCancel={(evento) => {
        evento.preventDefault();
        if (!enviando) onCancelar();
      }}
      className="w-[calc(100%-2rem)] max-w-[440px] rounded-2xl p-6 sm:p-8 shadow-[0px_12px_32px_rgba(15,23,41,0.16)] backdrop:bg-slate-900/40"
    >
      <h2 id="dialogo-titulo" className="text-slate-900 text-xl font-bold">
        {titulo}
      </h2>
      <p id="dialogo-descripcion" className="mt-3 text-slate-700 text-sm">
        {descripcion}
      </p>
      {children && <div className="mt-5 text-slate-900 text-[13px] font-medium">{children}</div>}
      {error && (
        <p role="alert" className="mt-5 text-red-700 text-sm border border-red-700 rounded-lg p-3">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="flex-1 text-[#1D6070] text-sm font-semibold leading-[normal] py-3 px-4 rounded-lg border border-[#1D6070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D6070] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {textoCancelar}
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          aria-disabled={enviando}
          className={`flex-1 text-white text-sm font-semibold leading-[normal] py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed ${
            peligro ? 'bg-red-700 focus:ring-red-700' : 'bg-[#1D6070] focus:ring-[#1D6070]'
          }`}
        >
          {enviando ? 'Procesando…' : textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}
