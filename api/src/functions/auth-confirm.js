const { app } = require('@azure/functions');

const { ensureSchema } = require('../db/schema');
const { execute } = require('../db/neon-client');
const { json, readJsonBody } = require('../utils/http');

app.http('auth-confirm', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    await ensureSchema();

    let token = request.query.get('token');

    if (!token) {
      const body = await readJsonBody(request);
      if (body && typeof body === 'object' && typeof body.token === 'string') {
        token = body.token;
      }
    }

    if (!token) {
      return json(400, { error: 'Token de confirmação não informado.' });
    }

    try {
      const { rows } = await execute(
        `UPDATE users
            SET email_confirmation_token = NULL,
                email_confirmation_sent_at = NULL,
                email_confirmed_at = NOW(),
                updated_at = NOW()
          WHERE email_confirmation_token = $1
          RETURNING id, email, name, email_confirmed_at, created_at`,
        [token]
      );

      if (rows.length === 0) {
        return json(404, { error: 'Token de confirmação inválido ou expirado.' });
      }

      const user = rows[0];

      return json(200, {
        message: 'E-mail confirmado com sucesso. Agora você pode acessar a aplicação.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailConfirmed: Boolean(user.email_confirmed_at),
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      context.error('Erro ao confirmar e-mail', error);
      return json(500, {
        error: 'Não foi possível confirmar o e-mail agora. Tente novamente mais tarde.',
      });
    }
  },
});
