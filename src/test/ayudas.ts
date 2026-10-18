import { fireEvent } from '@testing-library/react';

/** Escribe un valor en el campo con ese id (sirve también para fecha y hora) */
export function poner(id: string, valor: string): void {
  const campo = document.getElementById(id);
  if (!campo) throw new Error(`No existe el campo #${id}`);
  fireEvent.change(campo, { target: { value: valor } });
}

/** Fecha lejana: siempre es futura para las reglas de "no anterior a hoy" */
export const FUTURO = '2099-06-15';
