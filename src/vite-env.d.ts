/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend en despliegue. Vacia en desarrollo (proxy de Vite). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
