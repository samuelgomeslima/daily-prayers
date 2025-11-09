const { app } = require('@azure/functions');

const { createUser, findUserByEmail } = require('../repositories/users');
const { createDefaultPlan, saveLifePlan } = require('../repositories/life-plan');
const { DEFAULT_SETTINGS, saveModelSettings } = require('../repositories/model-settings');
const { createToken, hashPassword } = require('../utils/auth');
const { badRequest, conflict, jsonResponse, readJsonBody, serverError } = require('../utils/http');

function isValidEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function isStrongPassword(password) {
  return typeof password === 'string' && password.trim().length >= 8;
}

app.http('auth-register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: async (request, context) => {
    let body;

    try {
      body = await readJsonBody(request);
    } catch (error) {
      context.warn('Não foi possível interpretar o corpo da requisição.', error);
      return badRequest('Envie os dados em formato JSON válido.');
    }

    const email = typeof body?.email === 'string' ? body.email : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const displayName = typeof body?.displayName === 'string' ? body.displayName : '';

    if (!isValidEmail(email)) {
      return badRequest('Informe um e-mail válido.');
    }

    if (!isStrongPassword(password)) {
      return badRequest('A senha deve ter pelo menos 8 caracteres.');
    }

    try {
      const existing = await findUserByEmail(email);

      if (existing) {
        return conflict('Já existe um usuário cadastrado com este e-mail.');
      }

      const passwordHash = hashPassword(password.trim());
      const createdUser = await createUser({
        email,
        passwordHash,
        displayName,
      });

      // Provision default resources for the new user.
      const defaultPlan = createDefaultPlan(createdUser.id);
      await saveLifePlan(createdUser.id, defaultPlan);
      await saveModelSettings(createdUser.id, DEFAULT_SETTINGS);

      const token = createToken({
        sub: createdUser.id,
        email: createdUser.email,
        displayName: createdUser.displayName || null,
      });

      return jsonResponse(201, {
        token,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          displayName: createdUser.displayName || null,
        },
      });
    } catch (error) {
      context.error('Erro inesperado ao registrar usuário.', error);
      return serverError('Não foi possível concluir o cadastro no momento. Tente novamente em instantes.');
    }
  },
});
