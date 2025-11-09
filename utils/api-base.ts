import Constants from 'expo-constants';

import { resolveChatEndpoint } from '@/utils/chat-endpoint';

const EXP_DEFAULT_PORT = 4280;

type ExpoConstants = {
  expoConfig?: any;
  manifest?: any;
  manifest2?: any;
};

function extractHost(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw) {
    return null;
  }

  try {
    const value = raw.includes('://') ? raw : `http://${raw}`;
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function resolveExpoHost(constants: ExpoConstants): string | null {
  const candidates: unknown[] = [
    constants?.expoConfig?.extra?.expoGo?.debuggerHost,
    constants?.manifest2?.extra?.expoGo?.debuggerHost,
    constants?.manifest?.debuggerHost,
    constants?.expoConfig?.hostUri,
    constants?.expoConfig?.extra?.expoGo?.hostUri,
    constants?.manifest2?.extra?.expoGo?.hostUri,
    constants?.manifest?.hostUri,
  ];

  for (const candidate of candidates) {
    const host = extractHost(candidate);
    if (host) {
      return host;
    }
  }

  return null;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function resolveApiBaseUrl(): string | null {
  const env = process.env ?? {};

  if (env.EXPO_OS === 'web') {
    return '/api';
  }

  const constants: ExpoConstants = (Constants as any) ?? {};

  const explicitBase =
    env.EXPO_PUBLIC_API_BASE_URL ??
    constants?.expoConfig?.extra?.apiBaseUrl ??
    constants?.manifest2?.extra?.apiBaseUrl ??
    constants?.manifest?.extra?.apiBaseUrl ??
    env.EXPO_PUBLIC_CHAT_BASE_URL ??
    constants?.expoConfig?.extra?.chatBaseUrl ??
    constants?.manifest2?.extra?.chatBaseUrl ??
    constants?.manifest?.extra?.chatBaseUrl ??
    '';

  if (explicitBase) {
    try {
      return trimTrailingSlash(new URL(explicitBase).toString());
    } catch {
      // Fall through to derived values when the base URL is malformed.
    }
  }

  const chatEndpoint = resolveChatEndpoint();

  if (typeof chatEndpoint === 'string' && chatEndpoint) {
    if (chatEndpoint.startsWith('/')) {
      return trimTrailingSlash(chatEndpoint.replace(/\/chat$/, ''));
    }

    try {
      const url = new URL(chatEndpoint);
      url.pathname = url.pathname.replace(/\/chat$/, '');
      url.search = '';
      url.hash = '';
      return trimTrailingSlash(url.toString());
    } catch {
      // Ignore errors and fall back to Expo host resolution.
    }
  }

  const host = resolveExpoHost(constants);

  if (host) {
    return `http://${host}:${EXP_DEFAULT_PORT}/api`;
  }

  return null;
}

export function resolveApiUrl(pathname: string): string {
  const baseUrl = resolveApiBaseUrl();

  if (!baseUrl) {
    throw new Error('Não foi possível determinar a URL base da API. Configure EXPO_PUBLIC_API_BASE_URL.');
  }

  if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
    return pathname;
  }

  if (baseUrl.endsWith('/') && pathname.startsWith('/')) {
    return `${baseUrl}${pathname.slice(1)}`;
  }

  if (!baseUrl.endsWith('/') && !pathname.startsWith('/')) {
    return `${baseUrl}/${pathname}`;
  }

  return `${baseUrl}${pathname}`;
}
