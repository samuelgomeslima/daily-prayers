const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

function ensureSecret() {
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured.');
  }
}

function signToken(payload) {
  ensureSecret();
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token) {
  ensureSecret();
  return jwt.verify(token, secret);
}

module.exports = {
  signToken,
  verifyToken,
};
