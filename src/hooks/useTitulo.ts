import { useEffect } from 'react';

/** Título de página distinto en cada pantalla (WCAG 2.4.2) */
export function useTitulo(titulo: string): void {
  useEffect(() => {
    document.title = `${titulo} — Vitalis`;
  }, [titulo]);
}
