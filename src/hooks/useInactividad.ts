import { useEffect, useRef } from 'react';

// Señales de que la persona sigue ahí. `scroll` y `pointermove` se omiten a propósito: se disparan
// sin parar y no indican una acción deliberada.
const EVENTOS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;

/**
 * Llama a `alExpirar` cuando pasan `minutos` sin actividad (HU-25: 30 minutos). Solo corre
 * mientras `activo` sea true. Es una ayuda de experiencia: la sesión también caduca en el servidor,
 * que es quien la hace cumplir.
 */
export function useInactividad(activo: boolean, minutos: number, alExpirar: () => void): void {
  const alExpirarRef = useRef(alExpirar);
  useEffect(() => {
    alExpirarRef.current = alExpirar;
  }, [alExpirar]);

  useEffect(() => {
    if (!activo) return;

    const limite = minutos * 60 * 1000;
    let temporizador = window.setTimeout(() => alExpirarRef.current(), limite);

    const reiniciar = () => {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(() => alExpirarRef.current(), limite);
    };

    for (const evento of EVENTOS) window.addEventListener(evento, reiniciar, { passive: true });
    return () => {
      window.clearTimeout(temporizador);
      for (const evento of EVENTOS) window.removeEventListener(evento, reiniciar);
    };
  }, [activo, minutos]);
}
