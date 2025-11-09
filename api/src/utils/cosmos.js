const crypto = require('crypto');

const COSMOS_VERSION = '2018-12-31';

function getCosmosConfig() {
  const endpoint = process.env.COSMOS_DB_ENDPOINT || process.env.COSMOS_ENDPOINT || '';
  const key = process.env.COSMOS_DB_KEY || process.env.COSMOS_KEY || '';
  const databaseId =
    process.env.COSMOS_DB_DATABASE_ID || process.env.COSMOS_DB_DATABASE || process.env.COSMOS_DATABASE || '';

  if (!endpoint || !key || !databaseId) {
    throw new Error(
      'Cosmos DB is not configured. Please set COSMOS_DB_ENDPOINT, COSMOS_DB_KEY and COSMOS_DB_DATABASE_ID environment variables.',
    );
  }

  return {
    endpoint: endpoint.replace(/\/?$/, ''),
    key,
    databaseId,
  };
}

function buildResourceLink(...segments) {
  return segments
    .map((segment) => segment.replace(/^\/+|\/+$|\s+/g, ''))
    .filter(Boolean)
    .join('/');
}

function buildResourceId(...segments) {
  return buildResourceLink(...segments).toLowerCase();
}

function buildAuthSignature({ verb, resourceType, resourceId, date, masterKey }) {
  const key = Buffer.from(masterKey, 'base64');
  const payload = `${verb.toLowerCase()}\n${resourceType.toLowerCase()}\n${resourceId}\n${date.toLowerCase()}\n\n`;
  const signature = crypto.createHmac('sha256', key).update(payload, 'utf8').digest('base64');
  return encodeURIComponent(`type=master&ver=1.0&sig=${signature}`);
}

async function cosmosRequest({
  method,
  resourceType,
  resourceId,
  resourceLink,
  body,
  partitionKey,
  headers = {},
  isQuery = false,
}) {
  const config = getCosmosConfig();
  const masterKey = config.key;
  const date = new Date().toUTCString();
  const url = `${config.endpoint}/${resourceLink}`;
  const authorization = buildAuthSignature({
    verb: method,
    resourceType,
    resourceId,
    date,
    masterKey,
  });

  const requestHeaders = new Headers({
    'x-ms-date': date,
    'x-ms-version': COSMOS_VERSION,
    authorization,
    Accept: 'application/json',
    ...headers,
  });

  if (partitionKey !== undefined) {
    requestHeaders.set('x-ms-documentdb-partitionkey', JSON.stringify([partitionKey]));
  }

  if (isQuery) {
    requestHeaders.set('x-ms-documentdb-isquery', 'True');
    requestHeaders.set('Content-Type', 'application/query+json');
  } else if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let requestBody;

  if (body !== undefined) {
    requestBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  const text = await response.text();
  let json = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const error = new Error(
      (json && (json.message || json.Message || json._message || json.code)) || 'Cosmos DB request failed.',
    );
    error.status = response.status;
    error.code = json ? json.code || json.Code : undefined;
    error.body = json ?? text;
    throw error;
  }

  return json;
}

function getContainerLink(containerId) {
  const { databaseId } = getCosmosConfig();
  return buildResourceLink('dbs', databaseId, 'colls', containerId);
}

function getDocumentsLink(containerId) {
  return buildResourceLink(getContainerLink(containerId), 'docs');
}

function getDocumentLink(containerId, documentId) {
  return buildResourceLink(getDocumentsLink(containerId), documentId);
}

async function queryDocuments(containerId, query, parameters = [], options = {}) {
  const containerLink = getContainerLink(containerId);
  const documentsLink = getDocumentsLink(containerId);
  const headers = { ...options.headers };

  if (options.crossPartition) {
    headers['x-ms-documentdb-query-enablecrosspartition'] = 'True';
  }

  const result = await cosmosRequest({
    method: 'POST',
    resourceType: 'docs',
    resourceId: buildResourceId(containerLink),
    resourceLink: documentsLink,
    body: { query, parameters },
    partitionKey: options.partitionKey,
    headers,
    isQuery: true,
  });

  return Array.isArray(result?.Documents) ? result.Documents : [];
}

async function readDocument(containerId, documentId, partitionKey) {
  const documentLink = getDocumentLink(containerId, documentId);
  return cosmosRequest({
    method: 'GET',
    resourceType: 'docs',
    resourceId: buildResourceId(documentLink),
    resourceLink: documentLink,
    partitionKey,
  });
}

async function createDocument(containerId, document, partitionKey, options = {}) {
  const containerLink = getContainerLink(containerId);
  const documentsLink = getDocumentsLink(containerId);

  const response = await cosmosRequest({
    method: 'POST',
    resourceType: 'docs',
    resourceId: buildResourceId(containerLink),
    resourceLink: documentsLink,
    body: document,
    partitionKey,
    headers: { Prefer: 'return=representation', ...options.headers },
  });

  return response;
}

async function upsertDocument(containerId, document, partitionKey, options = {}) {
  const containerLink = getContainerLink(containerId);
  const documentsLink = getDocumentsLink(containerId);

  const response = await cosmosRequest({
    method: 'POST',
    resourceType: 'docs',
    resourceId: buildResourceId(containerLink),
    resourceLink: documentsLink,
    body: document,
    partitionKey,
    headers: {
      Prefer: 'return=representation',
      'x-ms-documentdb-is-upsert': 'True',
      ...options.headers,
    },
  });

  return response;
}

async function replaceDocument(containerId, documentId, document, partitionKey, options = {}) {
  const documentLink = getDocumentLink(containerId, documentId);

  const response = await cosmosRequest({
    method: 'PUT',
    resourceType: 'docs',
    resourceId: buildResourceId(documentLink),
    resourceLink: documentLink,
    body: document,
    partitionKey,
    headers: { Prefer: 'return=representation', ...options.headers },
  });

  return response;
}

async function deleteDocument(containerId, documentId, partitionKey, options = {}) {
  const documentLink = getDocumentLink(containerId, documentId);

  await cosmosRequest({
    method: 'DELETE',
    resourceType: 'docs',
    resourceId: buildResourceId(documentLink),
    resourceLink: documentLink,
    partitionKey,
    headers: options.headers,
  });
}

module.exports = {
  buildResourceId,
  buildResourceLink,
  createDocument,
  deleteDocument,
  getContainerLink,
  getDocumentsLink,
  getDocumentLink,
  queryDocuments,
  readDocument,
  replaceDocument,
  upsertDocument,
};
