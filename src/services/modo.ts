// Solo desarrollo: con VITE_MODO_SIMULADO=true los servicios de sesión, especialidades, horarios y
// citas responden con datos en memoria (ver `services/simulado/`), para revisar las pantallas
// mientras el backend de esas historias no está listo. En producción (`vite build`) es siempre
// false y el código simulado no se incluye.
export const MODO_SIMULADO = import.meta.env.DEV && import.meta.env.VITE_MODO_SIMULADO === 'true';
