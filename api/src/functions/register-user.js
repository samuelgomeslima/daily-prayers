const { app } = require('@azure/functions');
const { randomUUID } = require('node:crypto');

const { hashSecret, createSessionToken } = require('../lib/crypto');
const { findUserByEmail, createUser, updateSessionToken } = require('../lib/auth-utils');

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isStrongPassword(value) {
  return typeof value === 'string' && value.trim().length >= 8;
}

app.http('register-user', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/register',
  handler: async (request, context) => {
    let payload;

    try {
      payload = await request.json();
    } catch (error) {
      context.warn('Invalid JSON payload for user registration.', error);
      return {
        status: 400,
        jsonBody: { message: 'O corpo da requisição deve ser um JSON válido.' },
      };
    }

    const email = payload?.email;
    const password = payload?.password;

    if (!isValidEmail(email)) {
      return {
        status: 400,
        jsonBody: { message: 'Informe um e-mail válido.' },
      };
    }

    if (!isStrongPassword(password)) {
      return {
        status: 400,
        jsonBody: { message: 'A senha deve conter pelo menos 8 caracteres.' },
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const existing = await findUserByEmail(normalizedEmail);

      if (existing) {
        return {
          status: 409,
          jsonBody: { message: 'Já existe um usuário cadastrado com este e-mail.' },
        };
      }

      const userId = randomUUID();
      const passwordHash = hashSecret(password.trim());

      await createUser({ id: userId, email: normalizedEmail, passwordHash });

      const session = createSessionToken();

      await updateSessionToken(userId, session.tokenId, session.hash);

      return {
        status: 201,
        jsonBody: {
          user: {
            id: userId,
            email: normalizedEmail,
          },
          token: session.token,
        },
      };
    } catch (error) {
      context.error('Failed to register user.', error);
      return {
        status: 500,
        jsonBody: { message: 'Não foi possível concluir o cadastro no momento.' },
      };
    }
  },
});
