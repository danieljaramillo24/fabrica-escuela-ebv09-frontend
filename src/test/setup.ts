import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cada prueba empieza con la pantalla vacía
afterEach(() => cleanup());

// jsdom no implementa del todo <dialog>: se simula solo lo que usa DialogoConfirmacion
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal ||= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close ||= function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}
