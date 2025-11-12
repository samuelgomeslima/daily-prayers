const { Buffer } = require('node:buffer');
const { URL } = require('node:url');

let cachedConfig = null;

function getConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  const connectionString = process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('NEON_DATABASE_URL is not configured.');
  }

  const parsed = new URL(connectionString);

  if (!parsed.username || !parsed.password || !parsed.hostname) {
    throw new Error('Invalid NEON_DATABASE_URL. Expected format: postgresql://user:password@host/database');
  }

  const credentials = `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`;
  const authorization = Buffer.from(credentials).toString('base64');
  const database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : '';
  const baseEndpoint = `https://${parsed.hostname}/sql`;
  const endpoint = database ? `${baseEndpoint}?database=${encodeURIComponent(database)}` : baseEndpoint;

  cachedConfig = {
    endpoint,
    authorization,
  };

  return cachedConfig;
}

async function execute(sql, params = []) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new Error('SQL statement must be a non-empty string.');
  }

  const { endpoint, authorization } = getConfig();
  const payload = { sql, params };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    const details = text && text.length < 200 ? text : 'Unexpected response body.';
    throw new Error(`Failed to parse response from Neon: ${details}`);
  }

  if (!response.ok) {
    const message = data?.error?.message ?? response.statusText ?? 'Unexpected Neon error.';
    throw new Error(message);
  }

  if (data.error) {
    throw new Error(data.error.message || 'Unexpected Neon error.');
  }

  const [result] = data.results ?? [];

  return {
    rows: result?.rows ?? [],
    rowCount: result?.rowCount ?? 0,
    fields: result?.fields ?? [],
    command: result?.command ?? null,
    raw: data,
  };
}

async function executeInTransaction(statements) {
  if (!Array.isArray(statements) || statements.length === 0) {
    throw new Error('Statements must be a non-empty array.');
  }

  const fullStatement = ['BEGIN', ...statements, 'COMMIT'].join(';');

  try {
    return await execute(fullStatement);
  } catch (error) {
    try {
      await execute('ROLLBACK');
    } catch {
      // Ignore rollback failures because the session is stateless.
    }

    throw error;
  }
}

module.exports = {
  execute,
  executeInTransaction,
};
