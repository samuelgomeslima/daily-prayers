import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

type StoredAuthSession = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

const STORAGE_KEY = '@daily-prayers/auth-session';
const STORAGE_FILE = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}auth-session.json`
  : null;

function isStoredSession(value: unknown): value is StoredAuthSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<StoredAuthSession>;
  return (
    typeof candidate.token === 'string' &&
    typeof candidate.user?.id === 'string' &&
    typeof candidate.user?.name === 'string' &&
    typeof candidate.user?.email === 'string'
  );
}

export async function loadStoredSession(): Promise<StoredAuthSession | null> {
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
      return isStoredSession(parsed) ? parsed : null;
    }

    if (!STORAGE_FILE) {
      return null;
    }

    const info = await FileSystem.getInfoAsync(STORAGE_FILE);

    if (!info.exists) {
      return null;
    }

    const content = await FileSystem.readAsStringAsync(STORAGE_FILE);
    const parsed = JSON.parse(content) as unknown;
    return isStoredSession(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Não foi possível carregar a sessão persistida.', error);
    return null;
  }
}

export async function persistSession(session: StoredAuthSession | null) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }

      if (!session) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return;
    }

    if (!STORAGE_FILE) {
      return;
    }

    if (!session) {
      await FileSystem.deleteAsync(STORAGE_FILE, { idempotent: true });
      return;
    }

    await FileSystem.writeAsStringAsync(STORAGE_FILE, JSON.stringify(session));
  } catch (error) {
    console.warn('Não foi possível persistir a sessão de autenticação.', error);
  }
}

export type { StoredAuthSession };
