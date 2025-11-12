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
import { Platform } from 'react-native';
import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system';

import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/utils/api-client';
const STORAGE_KEY = '@daily-prayers/model-settings';
const STORAGE_FILE = 'model-settings.json';

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

function getStorageUri() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!documentDirectory) {
    return null;
  }

  return `${documentDirectory}${STORAGE_FILE}`;
}

function sanitizeModel(value: unknown): ModelOption | null {
  if (typeof value !== 'string') {
    return null;
  }

  return AVAILABLE_MODELS.includes(value as ModelOption)
    ? (value as ModelOption)
    : null;
}

function sanitizeSettings(payload: unknown): ModelSettingsState | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const candidate = payload as Partial<Record<keyof ModelSettingsState, unknown>>;
  const catechistModel = sanitizeModel(candidate.catechistModel);
  const chatModel = sanitizeModel(candidate.chatModel);

  return {
    catechistModel: catechistModel ?? DEFAULT_SETTINGS.catechistModel,
    chatModel: chatModel ?? DEFAULT_SETTINGS.chatModel,
  };
}

async function readStoredSettings(): Promise<ModelSettingsState | null> {
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
      return sanitizeSettings(parsed);
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
    return sanitizeSettings(parsed);
  } catch (error) {
    console.warn('Não foi possível carregar as configurações de modelos.', error);
    return null;
  }
}

async function persistSettings(settings: ModelSettingsState) {
  try {
    const serialized = JSON.stringify(settings);

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, serialized);
      return;
    }

    const uri = getStorageUri();

    if (!uri) {
      return;
    }

    await writeAsStringAsync(uri, serialized);
  } catch (error) {
    console.warn('Não foi possível salvar as configurações de modelos.', error);
  }
}

export function ModelSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ModelSettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const hasHydratedRef = useRef(false);
  const { status: authStatus, token } = useAuth();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const stored = await readStoredSettings();

      if (stored && isMounted) {
        setSettings(stored);
      }

      if (isMounted) {
        setIsLoading(false);
        hasHydratedRef.current = true;
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !token) {
      return;
    }

    let isCurrent = true;

    (async () => {
      try {
        const response = await apiRequest<{ chatModel: ModelOption; catechistModel: ModelOption }>(
          '/model-preferences',
          { method: 'GET' },
          token
        );

        if (!isCurrent) {
          return;
        }

        setSettings((prev) => ({
          catechistModel: sanitizeModel(response.catechistModel) ?? prev.catechistModel,
          chatModel: sanitizeModel(response.chatModel) ?? prev.chatModel,
        }));
      } catch (error) {
        console.warn('Não foi possível carregar as preferências de modelos do servidor.', error);
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [authStatus, token]);

  const updateSettings = useCallback(
    (updater: (previous: ModelSettingsState) => ModelSettingsState) => {
      setSettings((prev) => {
        const next = updater(prev);

        if (hasHydratedRef.current) {
          void persistSettings(next);

          if (authStatus === 'authenticated' && token) {
            void apiRequest(
              '/model-preferences',
              {
                method: 'PUT',
                body: JSON.stringify({
                  chatModel: next.chatModel,
                  catechistModel: next.catechistModel,
                }),
              },
              token
            ).catch((error) => {
              console.warn('Não foi possível salvar as preferências de modelos no servidor.', error);
            });
          }
        }

        return next;
      });
    },
    [authStatus, token]
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
      availableModels: AVAILABLE_MODELS,
    }),
    [isLoading, setCatechistModel, setChatModel, settings]
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
