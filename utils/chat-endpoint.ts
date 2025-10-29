import Constants from 'expo-constants';

const EXPO_HOST_CANDIDATES = [
  Constants.expoConfig?.extra?.expoGo?.debuggerHost,
  Constants.manifest2?.extra?.expoGo?.debuggerHost,
  Constants.manifest?.debuggerHost,
  Constants.expoConfig?.hostUri,
  Constants.expoConfig?.extra?.expoGo?.hostUri,
  Constants.manifest2?.extra?.expoGo?.hostUri,
  Constants.manifest?.hostUri,
];

function resolveExpoHost(): string | null {
  const extractHost = (raw?: string | null) => {
    if (!raw) {
      return null;
    }

    try {
      const value = raw.includes('://') ? raw : `http://${raw}`;
      return new URL(value).hostname;
    } catch {
      return null;
    }
  };

  for (const candidate of EXPO_HOST_CANDIDATES) {
    const host = extractHost(candidate);

    if (host) {
      return host;
    }
  }

  return null;
}

export function resolveChatEndpoint(): string | null {
  if (process.env.EXPO_OS === 'web') {
    return '/api/chat';
  }

  const envBaseUrl =
    process.env.EXPO_PUBLIC_CHAT_BASE_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    process.env.EXPO_PUBLIC_SITE_URL ??
    Constants.expoConfig?.extra?.chatBaseUrl ??
    Constants.expoConfig?.extra?.apiBaseUrl ??
    Constants.manifest2?.extra?.chatBaseUrl ??
    Constants.manifest2?.extra?.apiBaseUrl ??
    Constants.manifest?.extra?.chatBaseUrl ??
    Constants.manifest?.extra?.apiBaseUrl ??
    '';

  if (envBaseUrl) {
    try {
      return new URL('/api/chat', envBaseUrl).toString();
    } catch {
      // If the base URL is malformed we fall back to the Expo host resolution below.
    }
  }

  const host = resolveExpoHost();

  if (host) {
    return `http://${host}:4280/api/chat`;
  }

  return null;
}
