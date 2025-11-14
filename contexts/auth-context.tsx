import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system';

import { buildApiUrl, resolveApiBaseUrl } from '@/utils/api-endpoint';

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type AuthContextValue = {
  user: AuthenticatedUser | null;
  token: string | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  apiBaseUrl: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = '@daily-prayers/auth';
const AUTH_STORAGE_FILE = 'auth-state.json';

type PersistedAuthState = {
  token: string;
  user: AuthenticatedUser;
};

function getStorageUri() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!documentDirectory) {
    return null;
  }

  return `${documentDirectory}${AUTH_STORAGE_FILE}`;
}

async function readPersistedState(): Promise<PersistedAuthState | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return null;
      }

      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PersistedAuthState) : null;
    }

    const storageUri = getStorageUri();

    if (!storageUri) {
      return null;
    }

    const info = await getInfoAsync(storageUri);

    if (!info.exists) {
      return null;
    }

    const content = await readAsStringAsync(storageUri);

    if (!content) {
      return null;
    }

    return JSON.parse(content) as PersistedAuthState;
  } catch (error) {
    console.warn('Não foi possível carregar o estado de autenticação persistido.', error);
    return null;
  }
}

async function persistState(payload: PersistedAuthState | null) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }

      if (!payload) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
      }

      return;
    }

    const storageUri = getStorageUri();

    if (!storageUri) {
      return;
    }

    if (!payload) {
      await deleteAsync(storageUri, { idempotent: true });
      return;
    }

    await writeAsStringAsync(storageUri, JSON.stringify(payload));
  } catch (error) {
    console.warn('Não foi possível salvar o estado de autenticação.', error);
  }
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const persisted = await readPersistedState();

      if (!isMounted) {
        return;
      }

      if (persisted?.token && persisted?.user) {
        setToken(persisted.token);
        setUser(persisted.user);
      }

      setIsInitializing(false);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateAuthState = useCallback(async (nextUser: AuthenticatedUser | null, nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);

    if (nextUser && nextToken) {
      await persistState({ user: nextUser, token: nextToken });
    } else {
      await persistState(null);
    }
  }, []);

  const authenticate = useCallback(
    async (endpointPath: string, email: string, password: string) => {
      const endpoint = buildApiUrl(endpointPath, apiBaseUrl);

      if (!endpoint) {
        throw new Error(
          'O endpoint da API não está configurado. Defina EXPO_PUBLIC_API_BASE_URL ou EXPO_PUBLIC_CHAT_BASE_URL.',
        );
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data: { user?: AuthenticatedUser; token?: string; message?: string } | null = null;

      try {
        data = await response.json();
      } catch (error) {
        // ignore parse errors; handled below
      }

      if (!response.ok) {
        const message = data?.message ?? 'Não foi possível concluir a operação.';
        throw new Error(message);
      }

      if (!data?.user || !data?.token) {
        throw new Error('A resposta da API não contém os dados esperados.');
      }

      await updateAuthState(data.user, data.token);
    },
    [apiBaseUrl, updateAuthState],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      await authenticate('/users/login', email.trim().toLowerCase(), password);
    },
    [authenticate],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      await authenticate('/users/register', email.trim().toLowerCase(), password);
    },
    [authenticate],
  );

  const signOut = useCallback(async () => {
    await updateAuthState(null, null);
  }, [updateAuthState]);

  const value = useMemo(
    () => ({
      user,
      token,
      isInitializing,
      isAuthenticated: Boolean(user && token),
      apiBaseUrl,
      signIn,
      signUp,
      signOut,
    }),
    [apiBaseUrl, isInitializing, signIn, signOut, signUp, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }

  return context;
}
