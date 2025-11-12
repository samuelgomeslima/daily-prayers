const { app } = require('@azure/functions');

const { ensureSchema } = require('../db/schema');
const { execute } = require('../db/neon-client');
const { verifyPassword } = require('../utils/passwords');
const { createSession } = require('../utils/sessions');
const { json, readJsonBody } = require('../utils/http');

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

app.http('auth-login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    await ensureSchema();

    const body = await readJsonBody(request);

    if (!body || typeof body !== 'object') {
      return json(400, { error: 'Envie as credenciais em formato JSON.' });
    }

    const { email, password } = body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return json(400, { error: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const normalizedEmail = normalizeEmail(email);
      const { rows } = await execute(
        `SELECT id, email, password_hash, name, email_confirmed_at, created_at
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [normalizedEmail]
      );

      if (rows.length === 0) {
        return json(401, { error: 'Credenciais inválidas.' });
      }

      const user = rows[0];

      if (!verifyPassword(password, user.password_hash)) {
        return json(401, { error: 'Credenciais inválidas.' });
      }

      if (!user.email_confirmed_at) {
        return json(403, {
          error: 'Confirme seu e-mail antes de acessar a aplicação.',
        });
      }

      const session = await createSession(user.id);

      return json(200, {
        token: session.token,
        expiresAt: session.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailConfirmed: Boolean(user.email_confirmed_at),
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      context.error('Erro ao autenticar usuário', error);
      return json(500, {
        error: 'Não foi possível realizar o login agora. Tente novamente em instantes.',
      });
    }
  },
});
