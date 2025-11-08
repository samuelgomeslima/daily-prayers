import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase, type SupabaseUser } from '@/lib/supabase';

type AuthResult = {
  success: boolean;
  message?: string;
  requiresConfirmation?: boolean;
};

type AuthContextValue = {
  user: SupabaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = supabase.subscribe((session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    supabase
      .initialize()
      .catch((error) => {
        console.warn('Não foi possível inicializar a sessão do Supabase.', error);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      await supabase.signIn(email.trim().toLowerCase(), password);
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar. Verifique as credenciais e tente novamente.';
      return { success: false, message };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await supabase.signUp(email.trim().toLowerCase(), password);

      if (result.requiresConfirmation) {
        return {
          success: true,
          requiresConfirmation: true,
          message:
            'Cadastro criado. Confira o e-mail enviado pelo Supabase para confirmar a conta e, em seguida, faça login.',
        };
      }

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.';
      return { success: false, message };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [isLoading, signIn, signOut, signUp, user],
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
