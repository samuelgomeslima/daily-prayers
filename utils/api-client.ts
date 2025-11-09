import { resolveApiUrl } from '@/utils/api-base';

type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  status: number;

  code?: string;

  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiFetch<TResponse = unknown>(
  pathname: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const { method = 'GET', body, token, signal, headers = {} } = options;
  const url = resolveApiUrl(pathname.startsWith('/') ? pathname : `/${pathname}`);

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal,
  };

  if (token) {
    requestInit.headers = {
      ...requestInit.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestInit);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  let payload: any = null;

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload;
    const message =
      typeof errorPayload?.error?.message === 'string' && errorPayload.error.message.trim()
        ? errorPayload.error.message.trim()
        : 'A solicitação ao servidor falhou.';
    const code = errorPayload?.error?.code;
    throw new ApiError(response.status, message, code, errorPayload?.error?.details);
  }

  return payload as TResponse;
}
