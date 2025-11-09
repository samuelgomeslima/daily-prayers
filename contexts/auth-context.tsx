import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { apiFetch, ApiError } from '@/utils/api-client';
import { loadStoredSession, persistSession, type StoredAuthSession } from '@/utils/auth-storage';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type ProfileResponse = {
  user: AuthUser;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const isHydratedRef = useRef(false);

  const applySession = useCallback(async (session: StoredAuthSession | null) => {
    setToken(session?.token ?? null);
    setUser(session?.user ?? null);
    await persistSession(session);
  }, []);

  const hydrate = useCallback(async () => {
    setStatus('checking');
    const stored = await loadStoredSession();

    if (!stored) {
      setUser(null);
      setToken(null);
      setStatus('unauthenticated');
      isHydratedRef.current = true;
      return;
    }

    setToken(stored.token);
    setUser(stored.user);

    try {
      const profile = await apiFetch<ProfileResponse>('/auth/profile', {
        token: stored.token,
      });

      const nextSession: StoredAuthSession = {
        token: stored.token,
        user: profile.user,
      };

      await persistSession(nextSession);
      setUser(profile.user);
      setStatus('authenticated');
    } catch (error) {
      console.warn('Sessão inválida. É necessário autenticar novamente.', error);
      await applySession(null);
      setStatus('unauthenticated');
    } finally {
      isHydratedRef.current = true;
    }
  }, [applySession]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      const session: StoredAuthSession = {
        token: response.token,
        user: response.user,
      };

      setToken(response.token);
      setUser(response.user);
      setStatus('authenticated');
      await persistSession(session);
    },
    []
  );

  const logout = useCallback(async () => {
    setStatus('unauthenticated');
    setUser(null);
    setToken(null);
    await persistSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      throw new ApiError(401, 'Sessão expirada. Faça login novamente.');
    }

    const profile = await apiFetch<ProfileResponse>('/auth/profile', { token });

    const session: StoredAuthSession = {
      token,
      user: profile.user,
    };

    setUser(profile.user);
    await persistSession(session);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, login, logout, refreshProfile }),
    [login, logout, refreshProfile, status, token, user]
  );

  if (!isHydratedRef.current && status === 'checking') {
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
