const { URL } = require('node:url');
const { Buffer } = require('node:buffer');

const SUPPORTED_SCHEMES = new Set(['postgres:', 'postgresql:']);

function normalizeBaseUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  const trailingSlashNormalized = parsed.pathname.replace(/\/+$/, '');
  const basePath = trailingSlashNormalized ? `${trailingSlashNormalized}/` : '/';
  return `${parsed.origin}${basePath}`;
}

class NeonClient {
  constructor({
    connectionString =
      process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL,
    dataApiUrl = process.env.NEON_DATA_API_URL ?? process.env.NEON_HTTP_API_URL,
    dataApiKey = process.env.NEON_DATA_API_KEY ?? process.env.NEON_API_KEY,
  } = {}) {
    if (dataApiUrl) {
      this.configureDataApi(dataApiUrl, dataApiKey);
      return;
    }

    this.configureHttpSql(connectionString);
  }

  configureDataApi(dataApiUrl, dataApiKey) {
    if (!dataApiUrl) {
      throw new Error(
        'NEON_DATA_API_URL must be defined to use the Neon Data API client.'
      );
    }

    if (!dataApiKey) {
      throw new Error(
        'NEON_DATA_API_KEY (or NEON_API_KEY) must be defined to use the Neon Data API client.'
      );
    }

    let parsed;

    try {
      parsed = new URL(dataApiUrl);
    } catch (error) {
      throw new Error('The provided NEON_DATA_API_URL is not a valid URL.');
    }

    this.mode = 'data-api';
    this.baseUrl = normalizeBaseUrl(parsed.toString());
    // Neon exposes the SQL endpoint one level above the REST base (e.g. /neondb/query),
    // so we intentionally move up a directory from the /rest/v1 base instead of nesting
    // under it. Using "./query" would incorrectly target /rest/v1/query and return 404s.
    this.queryEndpoint = new URL('../query', this.baseUrl).toString();
    this.apiKey = dataApiKey;
  }

  configureHttpSql(connectionString) {
    if (!connectionString) {
      throw new Error(
        'NEON_DATABASE_URL environment variable is not defined. Provide a connection string or set NEON_DATA_API_URL.'
      );
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
      throw new Error('The Neon connection string must include both username and password.');
    }

    this.mode = 'http-sql';
    this.host = parsed.hostname;
    this.database = parsed.pathname.replace(/^\//, '') || undefined;
    this.authHeader = `Basic ${Buffer.from(
      `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`
    ).toString('base64')}`;
    this.queryEndpoint = `https://${this.host}/sql`;
  }

  async query(sql, params = []) {
    if (this.mode === 'data-api') {
      return this.queryViaDataApi(sql, params);
    }

    return this.queryViaHttpSql(sql, params);
  }

  async queryViaHttpSql(sql, params) {
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

    const response = await fetch(this.queryEndpoint, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return this.parseResponse(response);
  }

  async queryViaDataApi(sql, params) {
    const requestBody = {
      sql,
      query: sql,
      params,
      parameters: params,
      format: 'json',
    };

    const response = await fetch(this.queryEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return this.parseResponse(response);
  }

  async parseResponse(response) {
    let payload;

    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('Failed to parse Neon response as JSON.');
    }

    if (!response.ok) {
      const errorMessage =
        payload?.error?.message ??
        payload?.message ??
        payload?.error_message ??
        'Neon database request failed.';
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      throw error;
    }

    if (payload?.error) {
      const error = new Error(payload.error.message ?? 'Neon database returned an error.');
      error.code = payload.error.code;
      throw error;
    }

    if (Array.isArray(payload?.results)) {
      const result = payload.results[0];

      if (!result) {
        return { rows: [], rowCount: 0 };
      }

      const rows = Array.isArray(result.rows) ? result.rows : [];
      const rowCount = typeof result.rowCount === 'number' ? result.rowCount : rows.length;

      return { rows, rowCount };
    }

    if (Array.isArray(payload?.records)) {
      const records = payload.records;

      const columns = Array.isArray(payload?.columns)
        ? payload.columns.map((column) => column?.name).filter(Boolean)
        : null;

      let rows;

      if (columns && records.some(Array.isArray)) {
        rows = records.map((record) => {
          if (!Array.isArray(record)) {
            return record ?? {};
          }

          return record.reduce((acc, value, index) => {
            const columnName = columns[index] ?? index;
            acc[columnName] = value;
            return acc;
          }, {});
        });
      } else {
        rows = records.map((record) => (record && typeof record === 'object' ? record : {}));
      }

      return {
        rows,
        rowCount: rows.length,
      };
    }

    if (Array.isArray(payload?.row)) {
      return {
        rows: payload.row,
        rowCount: payload.row.length,
      };
    }

    return { rows: [], rowCount: 0 };
  }
}

let cachedClient;

function getClient() {
  if (!cachedClient) {
    cachedClient = new NeonClient();
  }

  return cachedClient;
}

async function query(sql, params = []) {
  const client = getClient();
  return client.query(sql, params);
}

module.exports = {
  query,
  NeonClient,
};
