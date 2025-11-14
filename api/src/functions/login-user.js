const { app } = require('@azure/functions');

const { verifySecret, createSessionToken } = require('../lib/crypto');
const { findUserByEmail, updateSessionToken } = require('../lib/auth-utils');

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

app.http('login-user', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/login',
  handler: async (request, context) => {
    let payload;

    try {
      payload = await request.json();
    } catch (error) {
      context.warn('Invalid JSON payload for login.', error);
      return {
        status: 400,
        jsonBody: { message: 'O corpo da requisição deve ser um JSON válido.' },
      };
    }

    const email = payload?.email;
    const password = payload?.password;

    if (!isValidEmail(email) || typeof password !== 'string') {
      return {
        status: 400,
        jsonBody: { message: 'Credenciais inválidas.' },
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const user = await findUserByEmail(normalizedEmail);

      if (!user || !user.passwordHash || !verifySecret(password.trim(), user.passwordHash)) {
        return {
          status: 401,
          jsonBody: { message: 'E-mail ou senha incorretos.' },
        };
      }

      const session = createSessionToken();
      await updateSessionToken(user.id, session.tokenId, session.hash);

      return {
        status: 200,
        jsonBody: {
          user: {
            id: user.id,
            email: user.email,
          },
          token: session.token,
        },
      };
    } catch (error) {
      context.error('Failed to authenticate user.', error);
      return {
        status: 500,
        jsonBody: { message: 'Não foi possível realizar o login no momento.' },
      };
    }
  },
});
