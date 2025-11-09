const EXP_DEFAULT_PORT = 4280;

let cachedExpoConstants;

function loadExpoConstants() {
  if (cachedExpoConstants !== undefined) {
    return cachedExpoConstants;
  }

  try {
    // eslint-disable-next-line global-require
    const moduleExport = require('expo-constants');
    cachedExpoConstants = moduleExport?.default ?? moduleExport ?? {};
  } catch {
    cachedExpoConstants = {};
  }

  return cachedExpoConstants;
}

function extractHost(raw) {
  if (!raw) {
    return null;
  }

  try {
    const value = raw.includes('://') ? raw : `http://${raw}`;
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function resolveExpoHost(constants) {
  const candidates = [
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

function resolveApiEndpoint(path, options = {}) {
  const env = options.env ?? process.env ?? {};
  const constants = options.constants ?? loadExpoConstants();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiPath = normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`;

  if (env.EXPO_OS === 'web') {
    return apiPath;
  }

  const envBaseUrl =
    env.EXPO_PUBLIC_API_BASE_URL ??
    env.EXPO_PUBLIC_CHAT_BASE_URL ??
    env.EXPO_PUBLIC_SITE_URL ??
    constants?.expoConfig?.extra?.apiBaseUrl ??
    constants?.expoConfig?.extra?.chatBaseUrl ??
    constants?.manifest2?.extra?.apiBaseUrl ??
    constants?.manifest2?.extra?.chatBaseUrl ??
    constants?.manifest?.extra?.apiBaseUrl ??
    constants?.manifest?.extra?.chatBaseUrl ??
    '';

  if (envBaseUrl) {
    try {
      return new URL(apiPath, envBaseUrl).toString();
    } catch {
      // If the base URL is malformed we fall back to the Expo host resolution below.
    }
  }

  const host = resolveExpoHost(constants);

  if (host) {
    return `http://${host}:${EXP_DEFAULT_PORT}${apiPath}`;
  }

  return null;
}

function resolveChatEndpoint(options = {}) {
  return resolveApiEndpoint('/chat', options);
}

module.exports = {
  resolveApiEndpoint,
  resolveChatEndpoint,
  // Exported for testing purposes to ensure the Expo host logic works as expected.
  _internal: {
    extractHost,
    resolveExpoHost,
    loadExpoConstants,
  },
};
