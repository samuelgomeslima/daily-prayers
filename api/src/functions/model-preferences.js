const { app } = require('@azure/functions');
const { randomUUID } = require('node:crypto');

const { ensureSchema } = require('../db/schema');
const { execute } = require('../db/neon-client');
const { getSession } = require('../utils/sessions');
const { getBearerToken, json, readJsonBody } = require('../utils/http');

const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-5-mini'];

function sanitizeModel(value) {
  if (typeof value !== 'string') {
    return null;
  }

  return ALLOWED_MODELS.includes(value) ? value : null;
}

async function resolveUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const session = await getSession(token);

  if (!session) {
    return null;
  }

  return session.userId;
}

app.http('model-preferences', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  handler: async (request) => {
    await ensureSchema();

    const userId = await resolveUser(request);

    if (!userId) {
      return json(401, { error: 'Sessão inválida. Faça login novamente.' });
    }

    if (request.method === 'GET') {
      const { rows } = await execute(
        'SELECT chat_model, catechist_model FROM ai_model_preferences WHERE user_id = $1 LIMIT 1',
        [userId]
      );

      if (rows.length === 0) {
        return json(200, {
          chatModel: 'gpt-4o-mini',
          catechistModel: 'gpt-4o-mini',
        });
      }

      const preferences = rows[0];

      return json(200, {
        chatModel: preferences.chat_model,
        catechistModel: preferences.catechist_model,
      });
    }

    const body = await readJsonBody(request);

    if (!body || typeof body !== 'object') {
      return json(400, { error: 'Envie os campos chatModel e catechistModel em formato JSON.' });
    }

    const chatModel = sanitizeModel(body.chatModel);
    const catechistModel = sanitizeModel(body.catechistModel);

    if (!chatModel || !catechistModel) {
      return json(400, {
        error: 'Modelos inválidos. Utilize apenas valores suportados.',
        availableModels: ALLOWED_MODELS,
      });
    }

    const timestamp = new Date().toISOString();

    const id = randomUUID();

    await execute(
      `INSERT INTO ai_model_preferences (id, user_id, chat_model, catechist_model, updated_at)
         VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id)
         DO UPDATE SET chat_model = EXCLUDED.chat_model,
                       catechist_model = EXCLUDED.catechist_model,
                       updated_at = EXCLUDED.updated_at`,
      [id, userId, chatModel, catechistModel, timestamp]
    );

    return json(200, {
      chatModel,
      catechistModel,
      updatedAt: timestamp,
    });
  },
});
