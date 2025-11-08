import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export const AVAILABLE_MODELS = ['gpt-5-mini', 'gpt-4o-mini'] as const;

export type ModelOption = (typeof AVAILABLE_MODELS)[number];

type ModelSettingsState = {
  catechistModel: ModelOption;
  chatModel: ModelOption;
};

type ModelSettingsContextValue = {
  catechistModel: ModelOption;
  chatModel: ModelOption;
  setCatechistModel: (model: ModelOption) => void;
  setChatModel: (model: ModelOption) => void;
  isLoading: boolean;
  availableModels: readonly ModelOption[];
};

const DEFAULT_SETTINGS: ModelSettingsState = {
  catechistModel: 'gpt-4o-mini',
  chatModel: 'gpt-4o-mini',
};

const ModelSettingsContext = createContext<ModelSettingsContextValue | undefined>(
  undefined
);

function sanitizeModel(value: unknown): ModelOption | null {
  if (typeof value !== 'string') {
    return null;
  }

  return AVAILABLE_MODELS.includes(value as ModelOption)
    ? (value as ModelOption)
    : null;
}

export function ModelSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ModelSettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    hasHydratedRef.current = false;

    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadSettings = async () => {
      setIsLoading(true);

      try {
        const stored = await supabase.fetchModelSettings(user.id);

        if (!isMounted) {
          return;
        }

        if (stored) {
          const sanitized: ModelSettingsState = {
            catechistModel:
              sanitizeModel(stored.catechist_model) ?? DEFAULT_SETTINGS.catechistModel,
            chatModel:
              sanitizeModel(stored.chat_model) ?? DEFAULT_SETTINGS.chatModel,
          };
          setSettings(sanitized);
        } else {
          await supabase.upsertModelSettings(user.id, DEFAULT_SETTINGS);
          if (isMounted) {
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } catch (error) {
        console.warn('Não foi possível carregar as configurações de modelos no Supabase.', error);
        if (isMounted) {
          setSettings(DEFAULT_SETTINGS);
        }
      } finally {
        if (isMounted) {
          hasHydratedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const persistSettings = useCallback(
    async (next: ModelSettingsState) => {
      if (!user) {
        return;
      }

      try {
        await supabase.upsertModelSettings(user.id, next);
      } catch (error) {
        console.warn('Não foi possível salvar as configurações de modelos no Supabase.', error);
      }
    },
    [user],
  );

  const updateSettings = useCallback(
    (updater: (previous: ModelSettingsState) => ModelSettingsState) => {
      setSettings((prev) => {
        const next = updater(prev);

        if (hasHydratedRef.current) {
          void persistSettings(next);
        }

        return next;
      });
    },
    [persistSettings],
  );

  const setCatechistModel = useCallback(
    (model: ModelOption) => {
      updateSettings((prev) => ({ ...prev, catechistModel: model }));
    },
    [updateSettings],
  );

  const setChatModel = useCallback(
    (model: ModelOption) => {
      updateSettings((prev) => ({ ...prev, chatModel: model }));
    },
    [updateSettings],
  );

  const value = useMemo<ModelSettingsContextValue>(
    () => ({
      catechistModel: settings.catechistModel,
      chatModel: settings.chatModel,
      setCatechistModel,
      setChatModel,
      isLoading,
      availableModels: AVAILABLE_MODELS,
    }),
    [isLoading, setCatechistModel, setChatModel, settings],
  );

  return (
    <ModelSettingsContext.Provider value={value}>
      {children}
    </ModelSettingsContext.Provider>
  );
}

export function useModelSettings() {
  const context = useContext(ModelSettingsContext);

  if (!context) {
    throw new Error('useModelSettings must be used within a ModelSettingsProvider');
  }

  return context;
}
