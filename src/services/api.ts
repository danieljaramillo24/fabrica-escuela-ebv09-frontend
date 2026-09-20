// Cliente HTTP central. Las pantallas no llaman a fetch: usan los servicios por dominio
// (usuarios.service.ts, ...), que a su vez usan `request`.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

const MENSAJE_SIN_CONEXION =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const MENSAJE_SERVIDOR =
  'El servicio no está disponible por ahora. Inténtalo de nuevo en unos minutos.';
const MENSAJE_CAMPOS = 'Revisa los campos marcados e inténtalo de nuevo.';
const MENSAJE_GENERICO = 'No pudimos completar la solicitud. Inténtalo de nuevo.';

const MENSAJES_POR_ESTADO: Record<number, string> = {
  400: 'Revisa los datos ingresados e inténtalo de nuevo.',
  401: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo para continuar.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscabas.',
};

/**
 * Error de la API en un formato uniforme para las pantallas.
 * - `message`: texto en lenguaje humano, listo para mostrar.
 * - `fieldErrors`: errores por campo cuando el backend responde `{ campo: "mensaje" }`.
 * - `status`: código HTTP (0 si no hubo respuesta, por ejemplo sin conexión).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** JWT de la sesión (HU-02). Se envía como `Authorization: Bearer`. */
  token?: string | null;
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// El backend responde de dos formas: un mapa { campo: mensaje } (validación de DTO)
// o un texto plano con la regla de negocio incumplida. Aquí se reconocen ambas.
function interpretarCuerpo(raw: string): { message?: string; fieldErrors?: Record<string, string> } {
  const text = raw.trim();
  if (!text) return {};

  try {
    const data: unknown = JSON.parse(text);
    if (typeof data === 'string') return { message: data };
    if (isRecord(data)) {
      const claves = Object.keys(data);
      if (claves.length === 1 && claves[0] === 'error' && typeof data.error === 'string') {
        return { message: data.error };
      }
      if (claves.length > 0 && Object.values(data).every((valor) => typeof valor === 'string')) {
        return { fieldErrors: data as Record<string, string> };
      }
    }
    return {};
  } catch {
    // No es JSON: texto plano. Se descarta HTML (páginas de error de proxies) y textos largos.
    if (text.startsWith('<') || text.length > 300) return {};
    return { message: text };
  }
}

async function construirError(response: Response): Promise<ApiError> {
  const { status } = response;

  // Nunca mostrar detalles técnicos de errores del servidor
  if (status >= 500) return new ApiError(status, MENSAJE_SERVIDOR);
  // 401 y 403: mensaje genérico, sin revelar información de la cuenta
  if (status === 401 || status === 403) return new ApiError(status, MENSAJES_POR_ESTADO[status]);

  const raw = await response.text().catch(() => '');
  const { message, fieldErrors } = interpretarCuerpo(raw);

  if (fieldErrors) return new ApiError(status, MENSAJE_CAMPOS, fieldErrors);
  return new ApiError(status, message ?? MENSAJES_POR_ESTADO[status] ?? MENSAJE_GENERICO);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    // Una petición cancelada no es un fallo: se deja pasar para que quien llama la ignore
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, MENSAJE_SIN_CONEXION);
  }

  if (!response.ok) throw await construirError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Texto seguro para mostrar al usuario a partir de cualquier error capturado. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
