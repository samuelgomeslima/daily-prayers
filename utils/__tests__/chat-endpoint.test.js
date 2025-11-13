const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveApiEndpoint,
  resolveChatEndpoint,
  _internal: { resolveExpoHost, resolveBaseUrl },
} = require('../chat-endpoint.js');

function mergeDeep(target, source) {
  if (!source || typeof source !== 'object') {
    return target;
  }

  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nextTarget = target[key] && typeof target[key] === 'object' ? target[key] : {};
      target[key] = mergeDeep({ ...nextTarget }, value);
    } else {
      target[key] = value;
    }
  }

  return target;
}

function createConstants(overrides) {
  const base = {
    expoConfig: { extra: { expoGo: {} } },
    manifest2: { extra: { expoGo: {} } },
    manifest: { extra: { expoGo: {} } },
  };

  if (!overrides) {
    return base;
  }

  return mergeDeep(base, overrides);
}

describe('resolveApiEndpoint', () => {
  it('returns the local path on web targets', () => {
    const result = resolveApiEndpoint('/api/example', { env: { EXPO_OS: 'web' } });
    assert.strictEqual(result, '/api/example');
  });

  it('defaults to EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_SITE_URL', () => {
    const env = { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com' };
    const result = resolveApiEndpoint('/api/example', { env });
    assert.strictEqual(result, 'https://api.example.com/api/example');

    const siteEnv = { EXPO_PUBLIC_SITE_URL: 'https://site.example.com' };
    const siteResult = resolveApiEndpoint('/api/example', { env: siteEnv });
    assert.strictEqual(siteResult, 'https://site.example.com/api/example');
  });

  it('honours custom environment key order', () => {
    const env = { EXPO_PUBLIC_SPECIAL_BASE: 'https://special.example.com' };
    const result = resolveApiEndpoint('/api/example', {
      env,
      envKeys: ['EXPO_PUBLIC_SPECIAL_BASE', 'EXPO_PUBLIC_API_BASE_URL'],
    });
    assert.strictEqual(result, 'https://special.example.com/api/example');
  });

  it('reads Expo manifest extras with custom keys', () => {
    const constants = createConstants({ expoConfig: { extra: { specialBaseUrl: 'https://extras.example.com' } } });
    const result = resolveApiEndpoint('/api/example', {
      constants,
      env: {},
      extraKeys: ['specialBaseUrl', 'apiBaseUrl'],
    });
    assert.strictEqual(result, 'https://extras.example.com/api/example');
  });

  it('falls back to the Expo debugger host when no base URL is resolved', () => {
    const constants = createConstants({ manifest: { debuggerHost: '192.168.0.42:19000' } });
    const result = resolveApiEndpoint('/api/example', { constants, env: {} });
    assert.strictEqual(result, 'http://192.168.0.42:4280/api/example');
  });

  it('returns null when no base URL or host can be resolved', () => {
    const result = resolveApiEndpoint('/api/example', { constants: createConstants(), env: {} });
    assert.strictEqual(result, null);
  });
});

describe('resolveChatEndpoint', () => {
  it('returns the local API path when running on web', () => {
    const result = resolveChatEndpoint({ env: { EXPO_OS: 'web' } });
    assert.strictEqual(result, '/api/chat');
  });

  it('prefers EXPO_PUBLIC_CHAT_BASE_URL when provided', () => {
    const env = { EXPO_PUBLIC_CHAT_BASE_URL: 'https://chat.example.com' };
    const result = resolveChatEndpoint({ env });
    assert.strictEqual(result, 'https://chat.example.com/api/chat');
  });

  it('falls back to EXPO_PUBLIC_API_BASE_URL when chat base is absent', () => {
    const env = { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com' };
    const result = resolveChatEndpoint({ env });
    assert.strictEqual(result, 'https://api.example.com/api/chat');
  });

  it('uses EXPO_PUBLIC_SITE_URL as the last environment fallback', () => {
    const env = { EXPO_PUBLIC_SITE_URL: 'https://site.example.com' };
    const result = resolveChatEndpoint({ env });
    assert.strictEqual(result, 'https://site.example.com/api/chat');
  });

  it('reads the base URL from expoConfig.extra.chatBaseUrl when no environment value exists', () => {
    const constants = createConstants({
      expoConfig: { extra: { chatBaseUrl: 'https://expo-config-chat.example.com' } },
    });

    const result = resolveChatEndpoint({ constants, env: {} });
    assert.strictEqual(result, 'https://expo-config-chat.example.com/api/chat');
  });

  it('falls back to expoConfig.extra.apiBaseUrl after chatBaseUrl', () => {
    const constants = createConstants({
      expoConfig: { extra: { apiBaseUrl: 'https://expo-config-api.example.com' } },
    });

    const result = resolveChatEndpoint({ constants, env: {} });
    assert.strictEqual(result, 'https://expo-config-api.example.com/api/chat');
  });

  it('uses manifest2.extra.chatBaseUrl when expoConfig values are unavailable', () => {
    const constants = createConstants({
      manifest2: { extra: { chatBaseUrl: 'https://manifest2-chat.example.com' } },
    });

    const result = resolveChatEndpoint({ constants, env: {} });
    assert.strictEqual(result, 'https://manifest2-chat.example.com/api/chat');
  });

  it('uses manifest2.extra.apiBaseUrl when chatBaseUrl is absent', () => {
    const constants = createConstants({
      manifest2: { extra: { apiBaseUrl: 'https://manifest2-api.example.com' } },
    });

    const result = resolveChatEndpoint({ constants, env: {} });
    assert.strictEqual(result, 'https://manifest2-api.example.com/api/chat');
  });

  it('falls back to manifest.extra.chatBaseUrl when manifest2 values are missing', () => {
    const constants = createConstants({
      manifest: { extra: { chatBaseUrl: 'https://manifest-chat.example.com' } },
    });

    const result = resolveChatEndpoint({ constants, env: {} });
    assert.strictEqual(result, 'https://manifest-chat.example.com/api/chat');
  });

  it('uses manifest.extra.apiBaseUrl when it is the last defined base URL', () => {
    const constants = createConstants({
      manifest: { extra: { apiBaseUrl: 'https://manifest-api.example.com' } },
    });

    const result = resolveChatEndpoint({ constants, env: {} });
    assert.strictEqual(result, 'https://manifest-api.example.com/api/chat');
  });

  it('builds the endpoint from the Expo debugger host when environment values are malformed', () => {
    const constants = createConstants({
      expoConfig: { extra: { expoGo: { debuggerHost: 'bad url' } } },
      manifest2: { extra: { expoGo: { debuggerHost: null } } },
      manifest: { debuggerHost: '192.168.0.42:19000' },
    });

    const result = resolveChatEndpoint({ constants, env: { EXPO_PUBLIC_CHAT_BASE_URL: '::::' } });
    assert.strictEqual(result, 'http://192.168.0.42:4280/api/chat');
  });

  it('continues through hostUri fallbacks when debugger hosts are absent', () => {
    const constants = createConstants({
      expoConfig: {
        hostUri: 'http://bad host',
        extra: { expoGo: { hostUri: 'http://10.0.0.5:19000' } },
      },
      manifest2: { extra: { expoGo: { hostUri: 'http://10.0.0.6:19000' } } },
    });

    const result = resolveChatEndpoint({ constants, env: {} });
    assert.strictEqual(result, 'http://10.0.0.5:4280/api/chat');
  });

  it('returns null when no host or base URL can be resolved', () => {
    const result = resolveChatEndpoint({ constants: createConstants(), env: {} });
    assert.strictEqual(result, null);
  });
});

describe('resolveBaseUrl', () => {
  it('prefers environment values before manifest extras', () => {
    const env = { EXPO_PUBLIC_CUSTOM: 'https://env.example.com' };
    const constants = createConstants({ expoConfig: { extra: { custom: 'https://extra.example.com' } } });
    const baseUrl = resolveBaseUrl(env, constants, ['EXPO_PUBLIC_CUSTOM'], ['custom']);
    assert.strictEqual(baseUrl, 'https://env.example.com');
  });
});

describe('resolveExpoHost', () => {
  it('ignores invalid host values', () => {
    const constants = createConstants({
      expoConfig: { extra: { expoGo: { debuggerHost: ':::' } } },
      manifest2: { extra: { expoGo: { debuggerHost: 'example.com:19000' } } },
    });

    assert.strictEqual(resolveExpoHost(constants), 'example.com');
  });
});
