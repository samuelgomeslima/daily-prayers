const crypto = require('crypto');

const DEFAULT_ITERATIONS = 120000;
const DEFAULT_KEY_LENGTH = 64;
const DEFAULT_DIGEST = 'sha512';
const TOKEN_HEADER = { alg: 'HS256', typ: 'JWT' };

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || '';

  if (!secret) {
    throw new Error('AUTH_JWT_SECRET is not configured.');
  }

  return secret;
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding ? normalized + '='.repeat(4 - padding) : normalized;
  return Buffer.from(padded, 'base64').toString('utf8');
}

function base64UrlToBuffer(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding ? normalized + '='.repeat(4 - padding) : normalized;
  return Buffer.from(padded, 'base64');
}

function signJwt(header, payload, secret) {
  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  const content = `${headerSegment}.${payloadSegment}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(content)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${content}.${signature}`;
}

function createToken(payload, options = {}) {
  const secret = getJwtSecret();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresInSeconds =
    typeof options.expiresInSeconds === 'number' && options.expiresInSeconds > 0 ? options.expiresInSeconds : 60 * 60 * 24 * 7;
  const tokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };

  return signJwt(TOKEN_HEADER, tokenPayload, secret);
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Invalid token format.');
  }

  const secret = getJwtSecret();
  const segments = token.split('.');

  if (segments.length !== 3) {
    throw new Error('Invalid token structure.');
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;
  const content = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(content)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const providedSignature = base64UrlToBuffer(signatureSegment);
  const expectedSignatureBuffer = base64UrlToBuffer(expectedSignature);

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    throw new Error('Invalid token signature.');
  }

  const payloadJson = base64UrlDecode(payloadSegment);
  const payload = JSON.parse(payloadJson);

  if (typeof payload.exp === 'number' && Math.floor(Date.now() / 1000) >= payload.exp) {
    throw new Error('Token has expired.');
  }

  return payload;
}

function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Cannot hash an empty password.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = DEFAULT_ITERATIONS;
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, iterations, DEFAULT_KEY_LENGTH, DEFAULT_DIGEST)
    .toString('hex');

  return `${iterations}:${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || password.length === 0) {
    return false;
  }

  if (typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }

  const [iterationsString, salt, hash] = storedHash.split(':');
  const iterations = Number.parseInt(iterationsString, 10);

  if (!salt || !hash || !Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const hashBuffer = Buffer.from(hash, 'hex');
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, iterations, hashBuffer.length, DEFAULT_DIGEST)
    .toString('hex');

  return crypto.timingSafeEqual(hashBuffer, Buffer.from(derivedKey, 'hex'));
}

module.exports = {
  createToken,
  hashPassword,
  verifyPassword,
  verifyToken,
};
