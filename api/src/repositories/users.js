const crypto = require('crypto');

const { containers } = require('../utils/config');
const {
  createDocument,
  queryDocuments,
  readDocument,
} = require('../utils/cosmos');

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return null;
  }

  const containerId = containers.users();
  const query = 'SELECT TOP 1 * FROM c WHERE c.email = @email';
  const parameters = [{ name: '@email', value: normalized }];
  const results = await queryDocuments(containerId, query, parameters, { crossPartition: true });

  if (!results.length) {
    return null;
  }

  return results[0];
}

async function getUserById(userId) {
  if (!userId) {
    return null;
  }

  const containerId = containers.users();

  try {
    const user = await readDocument(containerId, userId, userId);
    return user;
  } catch (error) {
    if (error && typeof error.status === 'number' && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function createUser({ email, passwordHash, displayName }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || typeof passwordHash !== 'string' || passwordHash.length === 0) {
    throw new Error('Invalid user payload.');
  }

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const containerId = containers.users();
  const document = {
    id: userId,
    email: normalizedEmail,
    displayName: typeof displayName === 'string' ? displayName.trim() || null : null,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  const created = await createDocument(containerId, document, userId);
  return created;
}

module.exports = {
  createUser,
  findUserByEmail,
  getUserById,
  normalizeEmail,
};
