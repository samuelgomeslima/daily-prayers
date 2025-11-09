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

import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/utils/api-client';

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

type ApiModelSettingsResponse = {
  settings: ModelSettingsState;
  availableModels: readonly ModelOption[];
};

export function ModelSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ModelSettingsState>(DEFAULT_SETTINGS);
  const [availableModels, setAvailableModels] = useState<readonly ModelOption[]>(AVAILABLE_MODELS);
  const [isLoading, setIsLoading] = useState(true);
  const hasHydratedRef = useRef(false);
  const { status, token } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (status !== 'authenticated' || !token) {
        if (isMounted) {
          setSettings(DEFAULT_SETTINGS);
          setAvailableModels(AVAILABLE_MODELS);
          setIsLoading(false);
          hasHydratedRef.current = true;
        }
        return;
      }

      setIsLoading(true);

      try {
        const response = await apiFetch<ApiModelSettingsResponse>('/model-settings', { token });

        if (isMounted) {
          setSettings(response.settings);
          setAvailableModels(response.availableModels);
        }
      } catch (error) {
        console.warn('Não foi possível carregar as preferências de modelos.', error);
        if (isMounted) {
          setSettings(DEFAULT_SETTINGS);
          setAvailableModels(AVAILABLE_MODELS);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          hasHydratedRef.current = true;
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [status, token]);

  const updateSettings = useCallback(
    (updater: (previous: ModelSettingsState) => ModelSettingsState) => {
      setSettings((prev) => {
        const next = updater(prev);

        if (hasHydratedRef.current && token) {
          void apiFetch<ApiModelSettingsResponse>('/model-settings', {
            method: 'PUT',
            token,
            body: next,
          })
            .then((response) => {
              setAvailableModels(response.availableModels);
            })
            .catch((error) => {
              console.warn('Não foi possível atualizar as preferências de modelos.', error);
            });
        }

        return next;
      });
    },
    [token]
  );

  const setCatechistModel = useCallback(
    (model: ModelOption) => {
      updateSettings((prev) => ({ ...prev, catechistModel: model }));
    },
    [updateSettings]
  );

  const setChatModel = useCallback(
    (model: ModelOption) => {
      updateSettings((prev) => ({ ...prev, chatModel: model }));
    },
    [updateSettings]
  );

  const value = useMemo<ModelSettingsContextValue>(
    () => ({
      catechistModel: settings.catechistModel,
      chatModel: settings.chatModel,
      setCatechistModel,
      setChatModel,
      isLoading,
      availableModels,
    }),
    [availableModels, isLoading, setCatechistModel, setChatModel, settings]
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
