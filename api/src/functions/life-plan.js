const { app } = require('@azure/functions');

const { createDefaultPlan, getLifePlan, saveLifePlan } = require('../repositories/life-plan');
const { badRequest, jsonResponse, readJsonBody, serverError } = require('../utils/http');
const { requireUser } = require('../utils/require-user');

const PRACTICE_FREQUENCIES = new Set(['daily', 'weekly', 'monthly']);

function sanitizePractice(practice) {
  if (!practice || typeof practice !== 'object') {
    return null;
  }

  const id = typeof practice.id === 'string' && practice.id.trim() ? practice.id.trim() : null;

  if (!id) {
    return null;
  }

  const frequency = PRACTICE_FREQUENCIES.has(practice.frequency) ? practice.frequency : 'daily';
  const completedPeriods = Array.isArray(practice.completedPeriods)
    ? practice.completedPeriods.filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
    : [];

  return {
    id,
    title: typeof practice.title === 'string' ? practice.title.trim() : '',
    description: typeof practice.description === 'string' ? practice.description.trim() : undefined,
    frequency,
    isDefault: Boolean(practice.isDefault),
    completedPeriods,
  };
}

function sanitizePlan(payload) {
  const version = typeof payload?.version === 'number' && Number.isFinite(payload.version) ? payload.version : 1;
  const practices = Array.isArray(payload?.practices)
    ? payload.practices.map(sanitizePractice).filter(Boolean)
    : [];

  return {
    version,
    practices,
  };
}

app.http('life-plan', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'life-plan',
  handler: async (request, context) => {
    const authResult = await requireUser(request, context);

    if (authResult.error) {
      return authResult.error;
    }

    const userId = authResult.user.id;

    try {
      if ((request.method || request.httpMethod || '').toUpperCase() === 'GET') {
        const plan = await getLifePlan(userId);

        if (!plan) {
          const defaultPlan = createDefaultPlan(userId);
          const storedPlan = await saveLifePlan(userId, defaultPlan);
          return jsonResponse(200, { plan: storedPlan });
        }

        const sanitized = sanitizePlan(plan);
        const merged = { ...plan, ...sanitized };
        return jsonResponse(200, { plan: merged });
      }

      let body;

      try {
        body = await readJsonBody(request);
      } catch (error) {
        context.warn('Falha ao interpretar JSON ao atualizar plano de vida.', error);
        return badRequest('Envie os dados do plano em formato JSON válido.');
      }

      const sanitized = sanitizePlan(body);
      const updatedPlan = await saveLifePlan(userId, sanitized);
      return jsonResponse(200, { plan: updatedPlan });
    } catch (error) {
      context.error('Erro ao processar o plano de vida.', error);
      return serverError('Não foi possível sincronizar o plano de vida agora. Tente novamente em instantes.');
    }
  },
});
