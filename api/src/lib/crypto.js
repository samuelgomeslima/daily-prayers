const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');

const KEY_LENGTH = 64;

function hashSecret(secret) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(secret, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

function verifySecret(secret, stored) {
  if (typeof stored !== 'string') {
    return false;
  }

  const [salt, hash] = stored.split(':');

  if (!salt || !hash) {
    return false;
  }

  const derived = scryptSync(secret, salt, KEY_LENGTH);
  const storedBuffer = Buffer.from(hash, 'hex');

  if (storedBuffer.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(derived, storedBuffer);
}

function createSessionToken() {
  const tokenId = randomBytes(12).toString('hex');
  const secret = randomBytes(32).toString('hex');
  const token = `${tokenId}.${secret}`;
  const hash = hashSecret(secret);
  return { token, hash, tokenId };
}

module.exports = {
  hashSecret,
  verifySecret,
  createSessionToken,
};
