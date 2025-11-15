const { query } = require('./neon-client');
const { verifySecret } = require('./crypto');

async function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  const result = await query(
    `SELECT id, email, password_hash, session_token_hash, session_token_id FROM users WHERE email = $1 LIMIT 1`,
    [normalized]
  );

  const row = Array.isArray(result.rows) ? result.rows[0] : null;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    sessionTokenHash: row.session_token_hash,
    sessionTokenId: row.session_token_id,
  };
}

async function createUser({ id, email, passwordHash }) {
  await query(
    `INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())`,
    [id, email, passwordHash]
  );
}

async function updateSessionToken(userId, sessionTokenId, sessionTokenHash) {
  await query(
    `UPDATE users SET session_token_id = $1, session_token_hash = $2, updated_at = NOW() WHERE id = $3`,
    [sessionTokenId, sessionTokenHash, userId]
  );
}

async function getUserFromAuthorization(headerValue) {
  if (typeof headerValue !== 'string') {
    return null;
  }

  const [scheme, token] = headerValue.split(' ');

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  const [tokenId, secret] = token.split('.');

  if (!tokenId || !secret) {
    return null;
  }

  const result = await query(
    `SELECT id, email, session_token_hash FROM users WHERE session_token_id = $1 LIMIT 1`,
    [tokenId]
  );

  const row = Array.isArray(result.rows) ? result.rows[0] : null;

  if (!row || !row.session_token_hash) {
    return null;
  }

  const isValid = verifySecret(secret, row.session_token_hash);

  if (!isValid) {
    return null;
  }

  return { id: row.id, email: row.email };
}

module.exports = {
  findUserByEmail,
  createUser,
  updateSessionToken,
  getUserFromAuthorization,
};
