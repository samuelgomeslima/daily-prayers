const { app } = require('@azure/functions');

const { jsonResponse } = require('../lib/http');
const { requireAuthenticatedUser } = require('../lib/auth-middleware');

app.http('auth-profile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/profile',
  handler: async (request, context) => {
    try {
      const { user } = await requireAuthenticatedUser(request);

      return jsonResponse(200, {
        user,
      });
    } catch (error) {
      if (error.name === 'UnauthorizedError') {
        return jsonResponse(401, {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Faça login novamente para continuar.',
          },
        });
      }

      context.error('Unexpected error on auth/profile function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível carregar o perfil agora. Tente novamente em instantes.',
        },
      });
    }
  },
});
