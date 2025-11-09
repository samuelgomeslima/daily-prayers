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

const ModelSettingsContext = createContext<ModelSettingsContextValue | undefined>(undefined);

function sanitizeModel(value: unknown): ModelOption | null {
  if (typeof value !== 'string') {
    return null;
  }

  return AVAILABLE_MODELS.includes(value as ModelOption) ? (value as ModelOption) : null;
}

function sanitizeSettings(payload: unknown): ModelSettingsState {
  if (typeof payload !== 'object' || payload === null) {
    return DEFAULT_SETTINGS;
  }

  const candidate = payload as Partial<Record<keyof ModelSettingsState, unknown>>;
  const catechistModel = sanitizeModel(candidate.catechistModel);
  const chatModel = sanitizeModel(candidate.chatModel);

  return {
    catechistModel: catechistModel ?? DEFAULT_SETTINGS.catechistModel,
    chatModel: chatModel ?? DEFAULT_SETTINGS.chatModel,
  };
}

export function ModelSettingsProvider({ children }: { children: ReactNode }) {
  const { status, user, fetchWithAuth } = useAuth();

  const [settings, setSettings] = useState<ModelSettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (status !== 'authenticated' || !user) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      hasHydratedRef.current = false;
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(true);
    hasHydratedRef.current = false;

    const load = async () => {
      try {
        const response = await fetchWithAuth('/model-settings', { method: 'GET' });

        if (!isMounted) {
          return;
        }

        if (response.status === 404) {
          const createResponse = await fetchWithAuth('/model-settings', {
            method: 'PUT',
            json: DEFAULT_SETTINGS,
          });

          if (!isMounted) {
            return;
          }

          if (createResponse.ok) {
            const created = await createResponse.json();
            setSettings(sanitizeSettings(created?.settings ?? created));
            hasHydratedRef.current = true;
          } else {
            setSettings(DEFAULT_SETTINGS);
            hasHydratedRef.current = true;
          }
          return;
        }

        if (!response.ok) {
          setSettings(DEFAULT_SETTINGS);
          hasHydratedRef.current = true;
          return;
        }

        const data = await response.json();
        setSettings(sanitizeSettings(data?.settings ?? data));
        hasHydratedRef.current = true;
      } catch (error) {
        console.warn('Não foi possível carregar as configurações de modelos.', error);
        if (isMounted) {
          setSettings(DEFAULT_SETTINGS);
          hasHydratedRef.current = true;
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [fetchWithAuth, status, user?.id]);

  const updateSettings = useCallback(
    (updater: (previous: ModelSettingsState) => ModelSettingsState) => {
      setSettings((prev) => {
        const next = updater(prev);

        if (hasHydratedRef.current && status === 'authenticated') {
          void fetchWithAuth('/model-settings', {
            method: 'PUT',
            json: next,
          }).catch((error) => {
            console.warn('Não foi possível sincronizar as configurações de modelos.', error);
          });
        }

        return next;
      });
    },
    [fetchWithAuth, status],
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

  return <ModelSettingsContext.Provider value={value}>{children}</ModelSettingsContext.Provider>;
}

export function useModelSettings() {
  const context = useContext(ModelSettingsContext);

  if (!context) {
    throw new Error('useModelSettings must be used within a ModelSettingsProvider');
  }

  return context;
}
