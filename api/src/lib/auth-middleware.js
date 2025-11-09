const { verifyToken } = require('./jwt');
const { findUserById } = require('./users');

async function requireAuthenticatedUser(request) {
  const header = request.headers.get('authorization');

  if (!header) {
    const error = new Error('Authentication token not provided.');
    error.name = 'UnauthorizedError';
    throw error;
  }

  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    const error = new Error('Invalid authentication header.');
    error.name = 'UnauthorizedError';
    throw error;
  }

  try {
    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);

    if (!user) {
      const notFound = new Error('User not found.');
      notFound.name = 'UnauthorizedError';
      throw notFound;
    }

    return { user, token, payload };
  } catch (error) {
    const unauthorized = new Error('Authentication token is invalid or expired.');
    unauthorized.name = 'UnauthorizedError';
    unauthorized.cause = error;
    throw unauthorized;
  }
}

module.exports = {
  requireAuthenticatedUser,
};
