const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('module');

function loadApiEndpoint() {
  const filename = path.join(__dirname, '..', 'api-endpoint.ts');
  const source = fs.readFileSync(filename, 'utf8');

  const transformed = source
    .replace(/export function /g, 'function ')
    .replace(/(\w+)\?:\s*string\s*\|\s*null/g, '$1')
    .replace(/(\w+):\s*string\s*\|\s*null/g, '$1')
    .replace(/(\w+)\?:\s*string/g, '$1')
    .replace(/(\w+):\s*string/g, '$1');

  const loadedModule = new Module(filename);
  loadedModule.filename = filename;
  loadedModule.paths = Module._nodeModulePaths(path.dirname(filename));
  loadedModule._compile(
    `${transformed}\nmodule.exports = { resolveApiBaseUrl, buildApiUrl };`,
    filename,
  );

  return loadedModule.exports;
}

const { resolveApiBaseUrl, buildApiUrl } = loadApiEndpoint();

const ENV_KEYS = [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_CHAT_BASE_URL',
  'EXPO_PUBLIC_SITE_URL',
];

const backupEnv = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    backupEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (backupEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = backupEnv[key];
    }
  }
});

describe('resolveBase (via resolveApiBaseUrl)', () => {
  it('prefers EXPO_PUBLIC_CHAT_BASE_URL over EXPO_PUBLIC_API_BASE_URL and trims trailing slashes', () => {
    process.env.EXPO_PUBLIC_CHAT_BASE_URL = 'https://chat.example.com/';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com/';

    const result = resolveApiBaseUrl();

    assert.strictEqual(result, 'https://chat.example.com');
  });

  it('trims whitespace and trailing slashes for the first available base URL', () => {
    process.env.EXPO_PUBLIC_CHAT_BASE_URL = '  https://chat.example.com///  ';

    const result = resolveApiBaseUrl();

    assert.strictEqual(result, 'https://chat.example.com');
  });

  it('returns null when none of the environment variables are set', () => {
    const result = resolveApiBaseUrl();

    assert.strictEqual(result, null);
  });
});

describe('buildApiUrl', () => {
  it('uses a trimmed override and appends /api when missing', () => {
    const result = buildApiUrl('status', ' https://api.example.com/');

    assert.strictEqual(result, 'https://api.example.com/api/status');
  });

  it('does not duplicate the /api suffix', () => {
    const result = buildApiUrl('/status', 'https://api.example.com/api/');

    assert.strictEqual(result, 'https://api.example.com/api/status');
  });

  it('uses the resolved base URL when no override is provided', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com/';

    const result = buildApiUrl('prayers/today');

    assert.strictEqual(result, 'https://api.example.com/api/prayers/today');
  });

  it('returns null when no base URL is available', () => {
    const result = buildApiUrl('prayers/today');

    assert.strictEqual(result, null);
  });
});
