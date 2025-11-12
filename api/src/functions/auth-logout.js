const { app } = require('@azure/functions');

const { ensureSchema } = require('../db/schema');
const { revokeSession } = require('../utils/sessions');
const { getBearerToken, json } = require('../utils/http');

app.http('auth-logout', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request) => {
    await ensureSchema();

    const token = getBearerToken(request);

    if (token) {
      await revokeSession(token);
    }

    return json(200, { message: 'Sessão encerrada com sucesso.' });
  },
});
