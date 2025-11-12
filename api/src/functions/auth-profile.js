const { app } = require('@azure/functions');

const { ensureSchema } = require('../db/schema');
const { execute } = require('../db/neon-client');
const { getSession } = require('../utils/sessions');
const { getBearerToken, json } = require('../utils/http');

app.http('auth-profile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request) => {
    await ensureSchema();

    const token = getBearerToken(request);

    if (!token) {
      return json(401, { error: 'Token de autenticação não informado.' });
    }

    const session = await getSession(token);

    if (!session) {
      return json(401, { error: 'Sessão inválida ou expirada.' });
    }

    const { rows } = await execute(
      `SELECT id, email, name, email_confirmed_at, created_at
         FROM users
        WHERE id = $1
        LIMIT 1`,
      [session.userId]
    );

    if (!rows.length) {
      return json(404, { error: 'Usuário não encontrado.' });
    }

    const user = rows[0];

    return json(200, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailConfirmed: Boolean(user.email_confirmed_at),
        createdAt: user.created_at,
      },
    });
  },
});
