const { app } = require('@azure/functions');

const { jsonResponse } = require('../utils/http');
const { requireUser } = require('../utils/require-user');

app.http('auth-me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: async (request, context) => {
    const authResult = await requireUser(request, context);

    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;

    return jsonResponse(200, {
      user,
    });
  },
});
