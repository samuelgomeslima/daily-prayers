const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveChatEndpoint,
  _internal: { extractHost, resolveExpoHost },
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

describe('resolveExpoHost', () => {
  it('ignores invalid host values', () => {
    const constants = createConstants({
      expoConfig: { extra: { expoGo: { debuggerHost: ':::' } } },
      manifest2: { extra: { expoGo: { debuggerHost: 'example.com:19000' } } },
    });

    assert.strictEqual(resolveExpoHost(constants), 'example.com');
  });
});

describe('_internal.extractHost', () => {
  it('returns the hostname from URLs that include path segments', () => {
    assert.strictEqual(extractHost('http://example.com/some/path'), 'example.com');
    assert.strictEqual(extractHost('example.com:19000/some/path'), 'example.com');
  });

  it('treats host values without protocols as HTTP URLs', () => {
    assert.strictEqual(extractHost('localhost:3000'), 'localhost');
    assert.strictEqual(extractHost('sub.domain.test/with/path'), 'sub.domain.test');
  });

  it('returns null for falsy or malformed values', () => {
    assert.strictEqual(extractHost(''), null);
    assert.strictEqual(extractHost(null), null);
    assert.strictEqual(extractHost('::::'), null);
    assert.strictEqual(extractHost('http://'), null);
  });
});
