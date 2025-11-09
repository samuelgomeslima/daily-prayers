const { app } = require('@azure/functions');

const { findUserByEmail } = require('../repositories/users');
const { createToken, verifyPassword } = require('../utils/auth');
const { badRequest, jsonResponse, readJsonBody, serverError, unauthorized } = require('../utils/http');

function isValidEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

app.http('auth-login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: async (request, context) => {
    let body;

    try {
      body = await readJsonBody(request);
    } catch (error) {
      context.warn('Falha ao interpretar JSON no login.', error);
      return badRequest('Envie os dados de login em formato JSON válido.');
    }

    const email = typeof body?.email === 'string' ? body.email : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
      return badRequest('Informe um e-mail e senha válidos.');
    }

    try {
      const user = await findUserByEmail(email);

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return unauthorized('E-mail ou senha inválidos.');
      }

      const token = createToken({
        sub: user.id,
        email: user.email,
        displayName: user.displayName || null,
      });

      return jsonResponse(200, {
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName || null,
        },
      });
    } catch (error) {
      context.error('Erro inesperado no login.', error);
      return serverError('Não foi possível entrar agora. Tente novamente em instantes.');
    }
  },
});
