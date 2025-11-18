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
import { Platform, useColorScheme as useDeviceColorScheme } from 'react-native';
import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system';

type ThemePreference = 'system' | 'light' | 'dark';

type ThemeSettingsContextValue = {
  preference: ThemePreference;
  colorScheme: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
  isLoading: boolean;
};

const STORAGE_KEY = '@daily-prayers/theme-preference';
const STORAGE_FILE = 'theme-preference.json';
const DEFAULT_PREFERENCE: ThemePreference = 'system';

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | undefined>(
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

function sanitizePreference(value: unknown): ThemePreference | null {
  if (value === 'system' || value === 'light' || value === 'dark') {
    return value;
  }

  return null;
}

async function readStoredPreference(): Promise<ThemePreference | null> {
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

      if (typeof parsed === 'string') {
        return sanitizePreference(parsed);
      }

      if (typeof parsed === 'object' && parsed !== null) {
        return sanitizePreference((parsed as { preference?: unknown }).preference);
      }

      return null;
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

    if (typeof parsed === 'string') {
      return sanitizePreference(parsed);
    }

    return sanitizePreference((parsed as { preference?: unknown }).preference);
  } catch (error) {
    console.warn('Não foi possível carregar a preferência de tema.', error);
    return null;
  }
}

async function persistPreference(preference: ThemePreference) {
  try {
    const serialized = JSON.stringify({ preference });

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
    console.warn('Não foi possível salvar a preferência de tema.', error);
  }
}

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [isLoading, setIsLoading] = useState(true);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const stored = await readStoredPreference();

      if (stored && isMounted) {
        setPreferenceState(stored);
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

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(() => {
      if (hasHydratedRef.current) {
        void persistPreference(value);
      }

      return value;
    });
  }, []);

  const colorScheme: 'light' | 'dark' = preference === 'system' ? deviceColorScheme : preference;

  const value = useMemo<ThemeSettingsContextValue>(
    () => ({ preference, colorScheme, setPreference, isLoading }),
    [preference, colorScheme, setPreference, isLoading]
  );

  return (
    <ThemeSettingsContext.Provider value={value}>
      {children}
    </ThemeSettingsContext.Provider>
  );
}

export function useThemeSettings() {
  const context = useContext(ThemeSettingsContext);

  if (!context) {
    throw new Error('useThemeSettings must be used within a ThemeSettingsProvider');
  }

  return context;
}

export type { ThemePreference };
