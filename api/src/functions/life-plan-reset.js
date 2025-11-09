const { app } = require('@azure/functions');

const { jsonResponse } = require('../lib/http');
const { requireAuthenticatedUser } = require('../lib/auth-middleware');
const { query } = require('../lib/db');

app.http('life-plan-reset', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'life-plan/reset',
  handler: async (request, context) => {
    try {
      const { user } = await requireAuthenticatedUser(request);
      await query(
        `update life_plan_practices
            set completed_periods = '{}',
                updated_at = now()
         where user_id = $1`,
        [user.id]
      );

      return jsonResponse(204, undefined);
    } catch (error) {
      if (error.name === 'UnauthorizedError') {
        return jsonResponse(401, {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Faça login novamente para reiniciar as marcações.',
          },
        });
      }

      context.error('Unexpected error on life-plan/reset function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível reiniciar o plano agora. Tente novamente em instantes.',
        },
      });
    }
  },
});
