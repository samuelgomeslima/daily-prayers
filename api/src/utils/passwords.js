const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');

const KEY_LENGTH = 64;

function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('A senha deve conter ao menos 8 caracteres.');
  }

  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  const [salt, key] = storedHash.split(':');

  if (!salt || !key) {
    return false;
  }

  const derived = scryptSync(password, salt, KEY_LENGTH);

  try {
    return timingSafeEqual(Buffer.from(key, 'hex'), derived);
  } catch {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
};
