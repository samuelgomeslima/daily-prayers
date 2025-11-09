const { app } = require('@azure/functions');
const { z } = require('zod');

const { jsonResponse, readJson } = require('../lib/http');
const { requireAuthenticatedUser } = require('../lib/auth-middleware');
const { query } = require('../lib/db');

const AVAILABLE_MODELS = ['gpt-5-mini', 'gpt-4o-mini'];
const defaultSettings = {
  catechistModel: 'gpt-4o-mini',
  chatModel: 'gpt-4o-mini',
};

const schema = z.object({
  catechistModel: z.enum(AVAILABLE_MODELS).optional(),
  chatModel: z.enum(AVAILABLE_MODELS).optional(),
});

async function getSettings(userId) {
  const result = await query(
    `select user_id as "userId", catechist_model as "catechistModel",
            chat_model as "chatModel", updated_at as "updatedAt"
       from model_settings
      where user_id = $1`,
    [userId]
  );

  if (result.rowCount === 0) {
    await query(
      `insert into model_settings (user_id, catechist_model, chat_model)
       values ($1, $2, $3)
       on conflict (user_id) do nothing`,
      [userId, defaultSettings.catechistModel, defaultSettings.chatModel]
    );
    return {
      userId,
      catechistModel: defaultSettings.catechistModel,
      chatModel: defaultSettings.chatModel,
    };
  }

  return result.rows[0];
}

app.http('model-settings', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'model-settings',
  handler: async (request, context) => {
    let auth;

    try {
      auth = await requireAuthenticatedUser(request);
    } catch (error) {
      if (error.name === 'UnauthorizedError') {
        return jsonResponse(401, {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Faça login para gerenciar as configurações de modelos.',
          },
        });
      }

      context.error('Unexpected authentication error on model-settings function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível validar sua sessão agora.',
        },
      });
    }

    try {
      if (request.method === 'GET') {
        const settings = await getSettings(auth.user.id);
        return jsonResponse(200, { settings, availableModels: AVAILABLE_MODELS });
      }

      if (request.method === 'PUT') {
        const payload = await readJson(request);
        const data = schema.parse(payload);

        const next = {
          catechistModel: data.catechistModel ?? defaultSettings.catechistModel,
          chatModel: data.chatModel ?? defaultSettings.chatModel,
        };

        const result = await query(
          `insert into model_settings (user_id, catechist_model, chat_model)
             values ($1, $2, $3)
             on conflict (user_id)
             do update set catechist_model = excluded.catechist_model,
                         chat_model = excluded.chat_model,
                         updated_at = now()
             returning user_id as "userId", catechist_model as "catechistModel",
                       chat_model as "chatModel", updated_at as "updatedAt"`,
          [auth.user.id, next.catechistModel, next.chatModel]
        );

        return jsonResponse(200, { settings: result.rows[0], availableModels: AVAILABLE_MODELS });
      }

      return jsonResponse(405, {
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Método não suportado para /model-settings.',
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return jsonResponse(400, {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Os dados enviados são inválidos.',
            details: error.issues,
          },
        });
      }

      if (error.name === 'BadRequestError') {
        return jsonResponse(400, {
          error: {
            code: 'INVALID_JSON',
            message: 'Não foi possível interpretar o corpo da requisição como JSON válido.',
          },
        });
      }

      context.error('Unexpected error on model-settings function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível processar a solicitação agora. Tente novamente em instantes.',
        },
      });
    }
  },
});
