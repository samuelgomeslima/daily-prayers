import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import {
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system';

import { apiRequest } from '@/utils/api-client';

const STORAGE_KEY = '@daily-prayers/auth-state';
const STORAGE_FILE = 'auth-state.json';

export type AuthStatus = 'loading' | 'unauthenticated' | 'guest' | 'authenticated';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  emailConfirmed: boolean;
  createdAt: string;
};

export type AuthState = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
};

type AuthResult = { success: boolean; message?: string };

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (payload: { email: string; password: string; name?: string | null }) => Promise<AuthResult>;
  confirmEmail: (token: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const DEFAULT_STATE: AuthState = {
  status: 'loading',
  token: null,
  user: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type PersistableState = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
};

type StoredPayload = {
  status: AuthStatus;
  token?: string | null;
  user?: AuthUser | null;
};

function getStorageUri() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!documentDirectory) {
    return null;
  }

  return `${documentDirectory}${STORAGE_FILE}`;
}

function sanitizeStoredPayload(payload: unknown): PersistableState | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const candidate = payload as StoredPayload;

  if (candidate.status === 'authenticated') {
    if (typeof candidate.token !== 'string' || !candidate.token) {
      return null;
    }

    if (!candidate.user || typeof candidate.user.id !== 'string') {
      return null;
    }

    return {
      status: 'authenticated',
      token: candidate.token,
      user: candidate.user,
    };
  }

  if (candidate.status === 'guest') {
    return {
      status: 'guest',
      token: null,
      user: null,
    };
  }

  return {
    status: 'unauthenticated',
    token: null,
    user: null,
  };
}

async function readStoredState(): Promise<PersistableState | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return null;
      }

      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as unknown;
      return sanitizeStoredPayload(parsed);
    }

    const uri = getStorageUri();

    if (!uri) {
      return null;
    }

    const info = await getInfoAsync(uri);

    if (!info.exists) {
      return null;
    }

    const stored = await readAsStringAsync(uri);
    const parsed = JSON.parse(stored) as unknown;
    return sanitizeStoredPayload(parsed);
  } catch (error) {
    console.warn('Não foi possível carregar o estado de autenticação.', error);
    return null;
  }
}

async function persistState(state: PersistableState) {
  try {
    if (state.status === 'unauthenticated') {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(STORAGE_KEY);
        }
        return;
      }

      const uri = getStorageUri();

      if (!uri) {
        return;
      }

      const info = await getInfoAsync(uri);

      if (info.exists) {
        await deleteAsync(uri, { idempotent: true });
      }

      return;
    }

    const serialized = JSON.stringify(state);

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      }
      return;
    }

    const uri = getStorageUri();

    if (!uri) {
      return;
    }

    await writeAsStringAsync(uri, serialized);
  } catch (error) {
    console.warn('Não foi possível salvar o estado de autenticação.', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(DEFAULT_STATE);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const stored = await readStoredState();

      if (!isMounted) {
        return;
      }

      if (stored) {
        setState({ ...stored });
      } else {
        setState({ status: 'unauthenticated', token: null, user: null });
      }

      isHydratedRef.current = true;
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const persist = useCallback(async (next: PersistableState) => {
    if (!isHydratedRef.current) {
      return;
    }

    await persistState(next);
  }, []);

  const login = useCallback<AuthContextValue['login']>(
    async (email, password) => {
      try {
        const response = await apiRequest<{
          token: string;
          expiresAt: string;
          user: AuthUser;
        }>('/auth-login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        const nextState: AuthState = {
          status: 'authenticated',
          token: response.token,
          user: response.user,
        };

        setState(nextState);
        await persist(nextState);

        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível entrar no momento.';
        return { success: false, message };
      }
    },
    [persist]
  );

  const register = useCallback<AuthContextValue['register']>(async (payload) => {
    try {
      const response = await apiRequest<{ message?: string }>('/auth-register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: response.message ?? 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível concluir o cadastro agora.';
      return { success: false, message };
    }
  }, []);

  const confirmEmail = useCallback<AuthContextValue['confirmEmail']>(async (token) => {
    try {
      const response = await apiRequest<{ message?: string }>(`/auth-confirm?token=${encodeURIComponent(token)}`);
      return {
        success: true,
        message: response.message ?? 'E-mail confirmado com sucesso.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível confirmar o e-mail.';
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(async () => {
    if (state.status === 'authenticated' && state.token) {
      try {
        await apiRequest('/auth-logout', {
          method: 'POST',
        }, state.token);
      } catch (error) {
        console.warn('Não foi possível invalidar a sessão no servidor.', error);
      }
    }

    const nextState: AuthState = { status: 'unauthenticated', token: null, user: null };
    setState(nextState);
    await persist(nextState);
  }, [persist, state.status, state.token]);

  const continueAsGuest = useCallback(async () => {
    const nextState: AuthState = { status: 'guest', token: null, user: null };
    setState(nextState);
    await persist(nextState);
  }, [persist]);

  const refreshProfile = useCallback(async () => {
    if (state.status !== 'authenticated' || !state.token) {
      return;
    }

    try {
      const response = await apiRequest<{ user: AuthUser }>('/auth-profile', {
        method: 'GET',
      }, state.token);

      const nextState: AuthState = {
        status: 'authenticated',
        token: state.token,
        user: response.user,
      };

      setState(nextState);
      await persist(nextState);
    } catch (error) {
      console.warn('Não foi possível atualizar o perfil do usuário.', error);
      const fallbackState: AuthState = { status: 'unauthenticated', token: null, user: null };
      setState(fallbackState);
      await persist(fallbackState);
    }
  }, [persist, state.status, state.token]);

  const contextValue = useMemo<AuthContextValue>(() => ({
    status: state.status,
    user: state.user,
    token: state.token,
    isLoading: state.status === 'loading',
    login,
    register,
    confirmEmail,
    logout,
    continueAsGuest,
    refreshProfile,
  }), [state, login, register, confirmEmail, logout, continueAsGuest, refreshProfile]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuthContext deve ser utilizado dentro de um AuthProvider.');
  }

  return value;
}
