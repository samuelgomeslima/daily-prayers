const EXP_DEFAULT_PORT = 4280;

const DEFAULT_ENV_KEYS = ['EXPO_PUBLIC_API_BASE_URL', 'EXPO_PUBLIC_SITE_URL'];
const DEFAULT_EXTRA_KEYS = ['apiBaseUrl'];

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
    constants?.expoConfig?.extra?.expoGo?.hostUri,
    constants?.expoConfig?.hostUri,
    constants?.manifest2?.extra?.expoGo?.hostUri,
    constants?.manifest2?.hostUri,
    constants?.manifest?.extra?.expoGo?.hostUri,
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

function pickFirstString(source, keys) {
  if (!source) {
    return '';
  }

  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function resolveBaseUrl(env, constants, envKeys, extraKeys) {
  const preferredEnv = pickFirstString(env, envKeys);

  if (preferredEnv) {
    return preferredEnv;
  }

  const extrasCandidates = [
    constants?.expoConfig?.extra,
    constants?.manifest2?.extra,
    constants?.manifest?.extra,
  ];

  for (const extras of extrasCandidates) {
    const candidate = pickFirstString(extras, extraKeys);

    if (candidate) {
      return candidate;
    }
  }

  return '';
}

function resolveApiEndpoint(path, options = {}) {
  const normalizedPath = typeof path === 'string' && path.startsWith('/') ? path : `/${path ?? ''}`;
  const env = options.env ?? process.env ?? {};
  const constants = options.constants ?? loadExpoConstants();
  const envKeys = Array.isArray(options.envKeys) && options.envKeys.length > 0 ? options.envKeys : DEFAULT_ENV_KEYS;
  const extraKeys =
    Array.isArray(options.extraKeys) && options.extraKeys.length > 0 ? options.extraKeys : DEFAULT_EXTRA_KEYS;

  if (env.EXPO_OS === 'web') {
    return normalizedPath;
  }

  const baseUrl = resolveBaseUrl(env, constants, envKeys, extraKeys);

  if (baseUrl) {
    try {
      return new URL(normalizedPath, baseUrl).toString();
    } catch {
      // If the base URL is malformed we fall back to the Expo host resolution below.
    }
  }

  const host = resolveExpoHost(constants);

  if (host) {
    return `http://${host}:${EXP_DEFAULT_PORT}${normalizedPath}`;
  }

  return null;
}

function resolveChatEndpoint(options = {}) {
  return resolveApiEndpoint('/api/chat', {
    ...options,
    envKeys: ['EXPO_PUBLIC_CHAT_BASE_URL', 'EXPO_PUBLIC_API_BASE_URL', 'EXPO_PUBLIC_SITE_URL'],
    extraKeys: ['chatBaseUrl', 'apiBaseUrl'],
  });
}

module.exports = {
  resolveApiEndpoint,
  resolveChatEndpoint,
  // Exported for testing purposes to ensure the Expo host logic works as expected.
  _internal: {
    extractHost,
    resolveExpoHost,
    loadExpoConstants,
    resolveBaseUrl,
    pickFirstString,
  },
};
