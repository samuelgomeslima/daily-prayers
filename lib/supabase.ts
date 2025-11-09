import { Platform } from 'react-native';
import {
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase URL ou chave anônima não configurados. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export type SupabaseUser = {
  id: string;
  email?: string | null;
  [key: string]: any;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: SupabaseUser;
};

export type RosaryProgressState = {
  markedIds: string[];
  roundsCompleted: number;
  targetRounds: number;
};

const SESSION_STORAGE_KEY = '@daily-prayers/supabase-session';
const SESSION_FILE = 'supabase-session.json';

function getSessionStorageUri() {
  if (!documentDirectory) {
    return null;
  }

  return `${documentDirectory}${SESSION_FILE}`;
}

function normalizeSession(payload: any): SupabaseSession {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Sessão inválida retornada pelo Supabase.');
  }

  const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : 3600;
  const expiresAt =
    typeof payload.expires_at === 'number'
      ? payload.expires_at
      : Math.floor(Date.now() / 1000) + expiresIn;

  if (!payload.access_token || !payload.refresh_token) {
    throw new Error('O Supabase não retornou os tokens de sessão esperados.');
  }

  const user: SupabaseUser | null = payload.user && typeof payload.user === 'object' ? payload.user : null;

  if (!user || typeof user.id !== 'string') {
    throw new Error('Usuário inválido retornado pelo Supabase.');
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: expiresIn,
    expires_at: expiresAt,
    token_type: typeof payload.token_type === 'string' ? payload.token_type : 'bearer',
    user,
  };
}

async function readStoredSession(): Promise<SupabaseSession | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return null;
      }

      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as unknown;
      return normalizeSession(parsed);
    }

    const uri = getSessionStorageUri();

    if (!uri) {
      return null;
    }

    const info = await getInfoAsync(uri);

    if (!info.exists) {
      return null;
    }

    const stored = await readAsStringAsync(uri);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as unknown;
    return normalizeSession(parsed);
  } catch (error) {
    console.warn('Não foi possível carregar a sessão salva do Supabase.', error);
    return null;
  }
}

async function persistSession(session: SupabaseSession | null) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }

      if (!session) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      return;
    }

    const uri = getSessionStorageUri();

    if (!uri) {
      return;
    }

    if (!session) {
      const info = await getInfoAsync(uri);

      if (info.exists) {
        await deleteAsync(uri, { idempotent: true });
      }

      return;
    }

    await writeAsStringAsync(uri, JSON.stringify(session));
  } catch (error) {
    console.warn('Não foi possível salvar a sessão do Supabase.', error);
  }
}

function extractErrorMessage(payload: any): string | null {
  if (payload && typeof payload === 'object') {
    const candidates = [
      payload.message,
      payload.error_description,
      payload.error,
      payload.msg,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return null;
}

export type RestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type SessionListener = (session: SupabaseSession | null) => void;

export class SupabaseService {
  private session: SupabaseSession | null = null;
  private initializing: Promise<void> | null = null;
  private listeners = new Set<SessionListener>();

  async initialize() {
    if (!this.initializing) {
      this.initializing = (async () => {
        this.session = await readStoredSession();

        if (this.session && this.isSessionExpired(this.session)) {
          try {
            await this.refreshSession();
          } catch (error) {
            console.warn('Não foi possível renovar a sessão do Supabase ao iniciar.', error);
            await this.setSession(null);
          }
        }

        this.notifySession();
      })();
    }

    await this.initializing;
  }

  subscribe(listener: SessionListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentSession() {
    return this.session;
  }

  private notifySession() {
    for (const listener of this.listeners) {
      listener(this.session);
    }
  }

  private isSessionExpired(session: SupabaseSession) {
    const now = Math.floor(Date.now() / 1000);
    return session.expires_at - 60 <= now;
  }

  private async setSession(next: SupabaseSession | null) {
    this.session = next;
    await persistSession(next);
    this.notifySession();
  }

  private baseHeaders(): Record<string, string> {
    return {
      apikey: SUPABASE_ANON_KEY ?? '',
      'Content-Type': 'application/json',
    };
  }

  private async authRequest(path: string, init: RequestInit = {}, requiresAuth = false) {
    if (!SUPABASE_URL) {
      throw new Error('Supabase URL não configurada.');
    }

    const headers: Record<string, string> = {
      ...this.baseHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    };

    if (requiresAuth) {
      const session = await this.ensureValidSession();

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      let detail: string | null = null;

      try {
        const payload = await response.json();
        detail = extractErrorMessage(payload);
      } catch {
        // Ignore parsing errors.
      }

      throw new Error(
        detail ?? `Falha na requisição ao Supabase (${response.status}).`
      );
    }

    if (response.status === 204) {
      return null;
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private async ensureValidSession() {
    await this.initialize();

    if (!this.session) {
      return null;
    }

    if (this.isSessionExpired(this.session)) {
      try {
        await this.refreshSession();
      } catch (error) {
        console.warn('Não foi possível atualizar a sessão do Supabase.', error);
        await this.setSession(null);
      }
    }

    return this.session;
  }

  private async refreshSession() {
    if (!this.session) {
      throw new Error('Nenhuma sessão disponível para renovar.');
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: this.baseHeaders(),
      body: JSON.stringify({ refresh_token: this.session.refresh_token }),
    });

    if (!response.ok) {
      let detail: string | null = null;

      try {
        const payload = await response.json();
        detail = extractErrorMessage(payload);
      } catch {
        // Ignore parsing errors.
      }

      throw new Error(
        detail ?? 'Não foi possível renovar a sessão do Supabase.'
      );
    }

    const payload = await response.json();
    const nextSession = normalizeSession(payload);
    await this.setSession(nextSession);
    return nextSession;
  }

  async signUp(email: string, password: string) {
    const payload = await this.authRequest(
      '/auth/v1/signup',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false
    );

    // Alguns projetos podem exigir confirmação de e-mail e não retornam sessão.
    if (payload && payload.access_token) {
      const nextSession = normalizeSession(payload);
      await this.setSession(nextSession);
      return { session: nextSession, requiresConfirmation: false };
    }

    return { session: null, requiresConfirmation: true };
  }

  async signIn(email: string, password: string) {
    const payload = await this.authRequest(
      '/auth/v1/token?grant_type=password',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false
    );

    const session = normalizeSession(payload);
    await this.setSession(session);
    return session;
  }

  async signOut() {
    try {
      await this.authRequest(
        '/auth/v1/logout',
        {
          method: 'POST',
        },
        true
      );
    } catch (error) {
      console.warn('Falha ao encerrar a sessão no Supabase.', error);
    }

    await this.setSession(null);
  }

  async getUser(): Promise<SupabaseUser | null> {
    const session = await this.ensureValidSession();

    if (!session) {
      return null;
    }

    return session.user;
  }

  private async restRequest(path: string, init: RequestInit = {}, retry = true) {
    if (!SUPABASE_URL) {
      throw new Error('Supabase URL não configurada.');
    }

    const session = await this.ensureValidSession();

    if (!session) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const headers: Record<string, string> = {
      ...this.baseHeaders(),
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers as Record<string, string> | undefined),
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
      ...init,
      headers,
    });

    if (response.status === 401 && retry) {
      await this.refreshSession();
      return this.restRequest(path, init, false);
    }

    if (!response.ok) {
      let detail: string | null = null;

      try {
        const payload = await response.json();
        detail = extractErrorMessage(payload);
      } catch {
        // Ignore parsing errors.
      }

      throw new Error(
        detail ?? `Falha ao comunicar com o Supabase (${response.status}).`
      );
    }

    if (response.status === 204) {
      return null;
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async fetchNotes(userId: string) {
    const data = (await this.restRequest(
      `/notes?select=*&user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`
    )) as any[] | null;

    return Array.isArray(data) ? data : [];
  }

  async insertNote(payload: { userId: string; title: string; content: string; updatedAt: string }) {
    const data = (await this.restRequest('/notes', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        {
          user_id: payload.userId,
          title: payload.title,
          content: payload.content,
          updated_at: payload.updatedAt,
        },
      ]),
    })) as any[] | null;

    return data?.[0] ?? null;
  }

  async updateNote(payload: { id: string; userId: string; title: string; content: string; updatedAt: string }) {
    const data = (await this.restRequest(
      `/notes?id=eq.${encodeURIComponent(payload.id)}&user_id=eq.${encodeURIComponent(payload.userId)}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          updated_at: payload.updatedAt,
        }),
      }
    )) as any[] | null;

    return data?.[0] ?? null;
  }

  async deleteNote(id: string, userId: string) {
    await this.restRequest(
      `/notes?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  async fetchRosaryProgress(userId: string) {
    const data = (await this.restRequest(
      `/rosary_progress?select=sequence_id,state,updated_at&user_id=eq.${encodeURIComponent(userId)}`
    )) as any[] | null;

    return Array.isArray(data) ? data : [];
  }

  async upsertRosaryProgress(payload: {
    userId: string;
    sequenceId: string;
    state: RosaryProgressState;
    updatedAt?: string;
  }) {
    const markedIds = Array.isArray(payload.state.markedIds)
      ? payload.state.markedIds.filter((value) => typeof value === 'string')
      : [];

    const roundsCandidate = Number(payload.state.roundsCompleted);
    const normalizedRounds = Number.isFinite(roundsCandidate)
      ? Math.max(0, Math.trunc(roundsCandidate))
      : 0;

    const targetCandidate = Number(payload.state.targetRounds);
    const normalizedTarget = Number.isFinite(targetCandidate)
      ? Math.max(normalizedRounds, 1, Math.trunc(targetCandidate))
      : Math.max(normalizedRounds, 1);

    const body = [
      {
        user_id: payload.userId,
        sequence_id: payload.sequenceId,
        state: {
          markedIds,
          roundsCompleted: normalizedRounds,
          targetRounds: normalizedTarget,
        },
        updated_at: payload.updatedAt ?? new Date().toISOString(),
      },
    ];

    await this.restRequest('/rosary_progress', {
      method: 'POST',
      headers: {
        Prefer: 'return=minimal, resolution=merge-duplicates',
      },
      body: JSON.stringify(body),
    });
  }

  async fetchLifePlan(userId: string) {
    const data = (await this.restRequest(
      `/life_plan_practices?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.asc`
    )) as any[] | null;

    return Array.isArray(data) ? data : [];
  }

  async insertLifePlanPractices(
    userId: string,
    practices: Array<{
      title: string;
      description?: string | null;
      frequency: string;
      isDefault?: boolean;
    }>,
  ) {
    const payload = practices.map((practice) => ({
      user_id: userId,
      title: practice.title,
      description: practice.description ?? null,
      frequency: practice.frequency,
      is_default: Boolean(practice.isDefault),
      completed_periods: [],
    }));

    const data = (await this.restRequest('/life_plan_practices', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    })) as any[] | null;

    return Array.isArray(data) ? data : [];
  }

  async updateLifePlanPractice(
    userId: string,
    practiceId: string,
    changes: Partial<{ title: string; description: string | null; frequency: string; completedPeriods: string[] }>,
  ) {
    const payload: Record<string, unknown> = {};

    if (typeof changes.title === 'string') {
      payload.title = changes.title;
    }

    if ('description' in changes) {
      payload.description = changes.description ?? null;
    }

    if (typeof changes.frequency === 'string') {
      payload.frequency = changes.frequency;
    }

    if (Array.isArray(changes.completedPeriods)) {
      payload.completed_periods = changes.completedPeriods;
    }

    payload.updated_at = new Date().toISOString();

    const data = (await this.restRequest(
      `/life_plan_practices?id=eq.${encodeURIComponent(practiceId)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      }
    )) as any[] | null;

    return data?.[0] ?? null;
  }

  async deleteLifePlanPractice(userId: string, practiceId: string) {
    await this.restRequest(
      `/life_plan_practices?id=eq.${encodeURIComponent(practiceId)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  async resetLifePlanProgress(userId: string) {
    await this.restRequest(
      `/life_plan_practices?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ completed_periods: [] }),
      }
    );
  }

  async fetchChatMessages(userId: string) {
    const data = (await this.restRequest(
      `/chat_messages?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.asc`
    )) as any[] | null;

    return Array.isArray(data) ? data : [];
  }

  async insertChatMessage(userId: string, role: 'user' | 'assistant', content: string) {
    const data = (await this.restRequest('/chat_messages', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        {
          user_id: userId,
          role,
          content,
        },
      ]),
    })) as any[] | null;

    return data?.[0] ?? null;
  }

  async fetchModelSettings(userId: string) {
    const data = (await this.restRequest(
      `/model_settings?select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`
    )) as any[] | null;

    return data?.[0] ?? null;
  }

  async upsertModelSettings(userId: string, settings: { catechistModel: string; chatModel: string }) {
    const payload = {
      user_id: userId,
      catechist_model: settings.catechistModel,
      chat_model: settings.chatModel,
      updated_at: new Date().toISOString(),
    };

    const data = (await this.restRequest('/model_settings', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([payload]),
    })) as any[] | null;

    return data?.[0] ?? null;
  }
}

export const supabase = new SupabaseService();
