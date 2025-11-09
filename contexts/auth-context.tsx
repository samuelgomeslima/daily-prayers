import * as FileSystem from 'expo-file-system';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { resolveApiEndpoint } from '@/utils/chat-endpoint';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

type AuthFetchInit = RequestInit & { json?: unknown };

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchWithAuth: (path: string, init?: AuthFetchInit) => Promise<Response>;
};

const TOKEN_STORAGE_KEY = '@daily-prayers/auth-token';
const TOKEN_FILE = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}auth-token.json` : null;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type StoredTokenPayload = {
  token: string;
};

async function loadStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return null;
      }

      const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as StoredTokenPayload | null;
      return typeof parsed?.token === 'string' ? parsed.token : null;
    }

    if (!TOKEN_FILE) {
      return null;
    }

    const info = await FileSystem.getInfoAsync(TOKEN_FILE);

    if (!info.exists) {
      return null;
    }

    const content = await FileSystem.readAsStringAsync(TOKEN_FILE);
    const parsed = JSON.parse(content) as StoredTokenPayload | null;
    return typeof parsed?.token === 'string' ? parsed.token : null;
  } catch (error) {
    console.warn('Não foi possível carregar o token salvo.', error);
    return null;
  }
}

async function persistToken(value: string | null) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }

      if (value) {
        const payload: StoredTokenPayload = { token: value };
        window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload));
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      return;
    }

    if (!TOKEN_FILE) {
      return;
    }

    if (value) {
      const payload: StoredTokenPayload = { token: value };
      await FileSystem.writeAsStringAsync(
        TOKEN_FILE,
        JSON.stringify(payload),
        {
          encoding: FileSystem.EncodingType.UTF8,
        },
      );
    } else {
      const info = await FileSystem.getInfoAsync(TOKEN_FILE);
      if (info.exists) {
        await FileSystem.deleteAsync(TOKEN_FILE, { idempotent: true });
      }
    }
  } catch (error) {
    console.warn('Não foi possível salvar o token de autenticação.', error);
  }
}

function resolveApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const endpoint = resolveApiEndpoint(normalizedPath);

  if (!endpoint) {
    throw new Error(
      'A URL base da API não está configurada. Defina EXPO_PUBLIC_API_BASE_URL ou execute o app via Expo com o servidor de funções.',
    );
  }

  return endpoint;
}

async function fetchJson(path: string, init?: RequestInit & { json?: unknown }) {
  const { json, headers, body, ...rest } = init ?? {};
  let payloadBody: BodyInit | undefined = body;
  const requestHeaders = new Headers(headers ?? {});

  if (json !== undefined) {
    payloadBody = JSON.stringify(json);
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(resolveApiUrl(path), {
    ...rest,
    headers: requestHeaders,
    body: payloadBody,
  });

  return response;
}

async function extractErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { error?: { message?: unknown } };
    const message = data?.error?.message;
    return typeof message === 'string' && message.trim() ? message.trim() : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const clearSession = useCallback(async () => {
    setUser(null);
    setToken(null);
    await persistToken(null);
    setStatus('unauthenticated');
  }, []);

  const fetchProfile = useCallback(async (authToken: string): Promise<AuthUser | null> => {
    try {
      const response = await fetchJson('/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { user?: AuthUser };

      if (!data?.user || typeof data.user.id !== 'string') {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName ?? null,
      };
    } catch (error) {
      console.warn('Não foi possível validar a sessão atual.', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const storedToken = await loadStoredToken();

      if (!isMounted) {
        return;
      }

      if (!storedToken) {
        setStatus('unauthenticated');
        return;
      }

      const profile = await fetchProfile(storedToken);

      if (!isMounted) {
        return;
      }

      if (!profile) {
        await persistToken(null);
        setStatus('unauthenticated');
        return;
      }

      setToken(storedToken);
      setUser(profile);
      setStatus('authenticated');
    })();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const response = await fetchJson('/auth/login', {
        method: 'POST',
        json: { email, password },
      });

      if (!response.ok) {
        const message = (await extractErrorMessage(response)) ?? 'Não foi possível entrar com estas credenciais.';
        throw new Error(message);
      }

      const data = (await response.json()) as { token?: string; user?: AuthUser };

      if (!data?.token || !data?.user) {
        throw new Error('Resposta inválida do servidor de autenticação.');
      }

      await persistToken(data.token);
      setToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName ?? null,
      });
      setStatus('authenticated');
    },
    [],
  );

  const register = useCallback(
    async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
      const response = await fetchJson('/auth/register', {
        method: 'POST',
        json: { email, password, displayName },
      });

      if (!response.ok) {
        const message =
          (await extractErrorMessage(response)) ?? 'Não foi possível concluir o cadastro com os dados enviados.';
        throw new Error(message);
      }

      const data = (await response.json()) as { token?: string; user?: AuthUser };

      if (!data?.token || !data?.user) {
        throw new Error('Resposta inválida do servidor de cadastro.');
      }

      await persistToken(data.token);
      setToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName ?? null,
      });
      setStatus('authenticated');
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const fetchWithAuth = useCallback(
    async (path: string, init?: AuthFetchInit) => {
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const { json, headers, body, ...rest } = init ?? {};
      let payloadBody: BodyInit | undefined = body;
      const requestHeaders = new Headers(headers ?? {});
      requestHeaders.set('Authorization', `Bearer ${token}`);

      if (json !== undefined) {
        payloadBody = JSON.stringify(json);
        requestHeaders.set('Content-Type', 'application/json');
      }

      const response = await fetch(resolveApiUrl(path), {
        ...rest,
        headers: requestHeaders,
        body: payloadBody,
      });

      if (response.status === 401) {
        await clearSession();
        throw new Error('Sua sessão expirou. Faça login novamente.');
      }

      return response;
    },
    [clearSession, token],
  );

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    login,
    register,
    logout,
    fetchWithAuth,
  }), [status, user, login, register, logout, fetchWithAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }

  return context;
}
