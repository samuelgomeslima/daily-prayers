const { URL } = require('node:url');
const { Buffer } = require('node:buffer');

const SUPPORTED_SCHEMES = new Set(['postgres:', 'postgresql:']);

class NeonClient {
  constructor(connectionString) {
    if (!connectionString) {
      throw new Error('NEON_DATABASE_URL environment variable is not defined.');
    }

    let parsed;

    try {
      parsed = new URL(connectionString);
    } catch (error) {
      throw new Error('The provided NEON_DATABASE_URL is not a valid connection string.');
    }

    if (!SUPPORTED_SCHEMES.has(parsed.protocol)) {
      throw new Error('The NEON_DATABASE_URL must use the postgres:// scheme.');
    }

    if (!parsed.username || !parsed.password) {
      throw new Error('The NEON connection string must include both username and password.');
    }

    this.host = parsed.hostname;
    this.database = parsed.pathname.replace(/^\//, '') || undefined;
    this.authHeader = `Basic ${Buffer.from(`${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`).toString('base64')}`;
    this.baseUrl = `https://${this.host}`;
  }

  async query(sql, params = []) {
    const endpoint = `${this.baseUrl}/sql`;

    const requestBody = {
      query: sql,
      sql,
      params,
      parameters: params,
      format: 'json',
    };

    if (this.database) {
      requestBody.database = this.database;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    let payload;

    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('Failed to parse Neon response as JSON.');
    }

    if (!response.ok) {
      const errorMessage =
        payload?.error?.message ?? payload?.message ?? 'Neon database request failed.';
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      throw error;
    }

    if (payload?.error) {
      const error = new Error(payload.error.message ?? 'Neon database returned an error.');
      error.code = payload.error.code;
      throw error;
    }

    const result = payload?.results?.[0];

    if (!result) {
      return { rows: [], rowCount: 0 };
    }

    const rows = Array.isArray(result.rows) ? result.rows : [];
    const rowCount = typeof result.rowCount === 'number' ? result.rowCount : rows.length;

    return { rows, rowCount };
  }
}

let cachedClient;

function getClient() {
  if (!cachedClient) {
    const connectionString =
      process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    cachedClient = new NeonClient(connectionString);
  }

  return cachedClient;
}

async function query(sql, params = []) {
  const client = getClient();
  return client.query(sql, params);
}

module.exports = {
  query,
};
