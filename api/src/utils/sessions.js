const { createHash, randomBytes, randomUUID } = require('node:crypto');
const { execute } = require('../db/neon-client');

const parsedTtl = Number.parseInt(process.env.SESSION_TOKEN_TTL_DAYS ?? '30', 10);
const DEFAULT_TTL_DAYS = Number.isFinite(parsedTtl) && parsedTtl > 0 ? parsedTtl : 30;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

async function createSession(userId) {
  const token = randomBytes(48).toString('base64url');
  const tokenHash = hashToken(token);
  const id = randomUUID();
  const expiresAt = addDays(new Date(), DEFAULT_TTL_DAYS).toISOString();

  await execute(
    'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
    [id, userId, tokenHash, expiresAt]
  );

  return {
    token,
    expiresAt,
  };
}

async function getSession(token) {
  if (typeof token !== 'string' || token.length === 0) {
    return null;
  }

  const tokenHash = hashToken(token);
  const { rows } = await execute(
    'SELECT user_id, expires_at FROM user_sessions WHERE token_hash = $1 LIMIT 1',
    [tokenHash]
  );

  if (!rows.length) {
    return null;
  }

  const session = rows[0];
  const expiresAt = new Date(session.expires_at);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    await execute('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]);
    return null;
  }

  return {
    userId: session.user_id,
    expiresAt,
  };
}

async function revokeSession(token) {
  if (typeof token !== 'string' || token.length === 0) {
    return;
  }

  const tokenHash = hashToken(token);
  await execute('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]);
}

module.exports = {
  createSession,
  getSession,
  revokeSession,
};
