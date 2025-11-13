import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'daily-prayers.auth-token';
const AUTH_USER_KEY = 'daily-prayers.auth-user';

const DEFAULT_API_BASE_URL = 'http://localhost:7071/api';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.EXPO_PUBLIC_CHAT_BASE_URL ??
  process.env.EXPO_PUBLIC_SITE_URL ??
  DEFAULT_API_BASE_URL;

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export type AuthContextValue = {
  user: AuthenticatedUser | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: (overrideToken?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let secureStoreAvailable: boolean | null = null;

async function isSecureStoreReady() {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }

  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch (error) {
    console.warn('Unable to determine SecureStore availability.', error);
    secureStoreAvailable = false;
  }

  return secureStoreAvailable;
}

async function saveSecureItem(key: string, value: string | null) {
  if (!(await isSecureStoreReady())) {
    return;
  }

  try {
    if (!value) {
      await SecureStore.deleteItemAsync(key);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn('Unable to persist secure item', key, error);
  }
}

async function loadSecureItem(key: string) {
  if (!(await isSecureStoreReady())) {
    return null;
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn('Unable to load secure item', key, error);
    return null;
  }
}

async function fetchJson(input: string, init: RequestInit): Promise<any> {
  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch (networkError) {
    const error = new Error(
      'Não foi possível conectar-se ao servidor. Verifique sua conexão com a internet ou as configurações da API e tente novamente.',
    ) as Error & { status?: number; cause?: unknown };
    error.cause = networkError;
    throw error;
  }

  const data = await response
    .json()
    .catch(() => null)
    .then((parsed) => parsed ?? null);

  if (!response.ok) {
    const message =
      (data && typeof data === 'object'
        ? (data as { error?: { message?: string }; message?: string })?.error?.message ??
          (data as { message?: string }).message
        : null) ??
      (typeof data === 'string' && data.trim().length > 0 ? data : null) ??
      `Não foi possível completar a operação (erro ${response.status}).`;

    const error = new Error(message) as Error & { status?: number; response?: Response };
    error.status = response.status;
    error.response = response;
    throw error;
  }

  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const applySession = useCallback(async (nextToken: string, nextUser: AuthenticatedUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await Promise.all([
      saveSecureItem(AUTH_TOKEN_KEY, nextToken),
      saveSecureItem(AUTH_USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    await Promise.all([
      saveSecureItem(AUTH_TOKEN_KEY, null),
      saveSecureItem(AUTH_USER_KEY, null),
    ]);
  }, []);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setIsLoading(true);
      try {
        const data = await fetchJson(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (!data?.token || !data?.user) {
          throw new Error('Resposta inesperada do servidor.');
        }

        await applySession(data.token, data.user as AuthenticatedUser);
      } finally {
        setIsLoading(false);
      }
    },
    [applySession]
  );

  const register = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }) => {
      setIsLoading(true);
      try {
        const data = await fetchJson(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });

        if (!data?.token || !data?.user) {
          throw new Error('Resposta inesperada do servidor.');
        }

        await applySession(data.token, data.user as AuthenticatedUser);
      } finally {
        setIsLoading(false);
      }
    },
    [applySession]
  );

  const refreshSession = useCallback(
    async (overrideToken?: string) => {
      const activeToken = overrideToken ?? token;

      if (!activeToken) {
        return;
      }

      try {
        const data = await fetchJson(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });

        if (!data?.token || !data?.user) {
          throw new Error('Sessão inválida.');
        }

        await applySession(data.token, data.user as AuthenticatedUser);
      } catch (error) {
        const status = (error as { status?: number } | null)?.status;

        if (status === 401 || status === 403) {
          console.warn('Sessão inválida, limpando credenciais.', error);
          await clearSession();
          return;
        }

        console.warn(
          'Falha ao atualizar a sessão. Mantendo credenciais para tentar novamente.',
          error,
        );
      }
    },
    [applySession, clearSession, token]
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedToken, storedUserJson] = await Promise.all([
          loadSecureItem(AUTH_TOKEN_KEY),
          loadSecureItem(AUTH_USER_KEY),
        ]);

        if (storedToken && storedUserJson) {
          try {
            const parsedUser = JSON.parse(storedUserJson) as AuthenticatedUser;
            setToken(storedToken);
            setUser(parsedUser);
            await refreshSession(storedToken);
          } catch (error) {
            console.warn('Falha ao restaurar sessão armazenada.', error);
            await clearSession();
          }
        }
      } finally {
        setIsInitializing(false);
      }
    };

    void bootstrap();
  }, [clearSession, refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isInitializing,
      login,
      register,
      logout,
      refreshSession,
    }),
    [isInitializing, isLoading, login, logout, refreshSession, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }

  return context;
}
