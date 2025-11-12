export type ApiError = Error & {
  status?: number;
  payload?: unknown;
};

function getBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!baseUrl || !baseUrl.trim()) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL não está configurado.');
  }

  return baseUrl.replace(/\/$/, '');
}

function buildUrl(path: string) {
  if (/^https?:/i.test(path)) {
    return path;
  }

  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(options.headers ?? {});

  headers.set('Accept', 'application/json');

  const body = options.body;

  if (body != null && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      if (!response.ok) {
        const error: ApiError = new Error('Resposta inválida do servidor.');
        error.status = response.status;
        error.payload = text;
        throw error;
      }
    }
  }

  if (!response.ok) {
    const messageCandidate =
      typeof (payload as { error?: unknown })?.error === 'string'
        ? (payload as { error: string }).error
        : typeof (payload as { message?: unknown })?.message === 'string'
          ? (payload as { message: string }).message
          : response.statusText || 'Erro inesperado.';

    const error: ApiError = new Error(messageCandidate);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload as T;
}
