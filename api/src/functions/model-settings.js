const { app } = require('@azure/functions');

const { DEFAULT_SETTINGS, getModelSettings, saveModelSettings, sanitizeSettings } = require('../repositories/model-settings');
const { badRequest, jsonResponse, readJsonBody, serverError } = require('../utils/http');
const { requireUser } = require('../utils/require-user');

app.http('model-settings', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'model-settings',
  handler: async (request, context) => {
    const authResult = await requireUser(request, context);

    if (authResult.error) {
      return authResult.error;
    }

    const userId = authResult.user.id;
    const method = (request.method || request.httpMethod || '').toUpperCase();

    try {
      if (method === 'GET') {
        const settings = await getModelSettings(userId);

        if (!settings) {
          const stored = await saveModelSettings(userId, DEFAULT_SETTINGS);
          return jsonResponse(200, { settings: stored });
        }

        return jsonResponse(200, { settings });
      }

      let body;

      try {
        body = await readJsonBody(request);
      } catch (error) {
        context.warn('Falha ao interpretar JSON nas configurações de modelo.', error);
        return badRequest('Envie as configurações em formato JSON válido.');
      }

      const sanitized = sanitizeSettings(body);
      const stored = await saveModelSettings(userId, sanitized);
      return jsonResponse(200, { settings: stored });
    } catch (error) {
      context.error('Erro ao processar as configurações de modelo.', error);
      return serverError('Não foi possível atualizar as configurações agora. Tente novamente em instantes.');
    }
  },
});
