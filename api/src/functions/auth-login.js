const { app } = require('@azure/functions');
const { z } = require('zod');

const { jsonResponse, readJson } = require('../lib/http');
const { findUserByEmail } = require('../lib/users');
const { verifyPassword } = require('../lib/password');
const { signToken } = require('../lib/jwt');

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

app.http('auth-login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: async (request, context) => {
    try {
      const payload = await readJson(request);
      const data = schema.parse(payload);

      const user = await findUserByEmail(data.email.toLowerCase());

      if (!user) {
        return jsonResponse(401, {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'E-mail ou senha inválidos.',
          },
        });
      }

      const passwordValid = await verifyPassword(data.password, user.passwordHash);

      if (!passwordValid) {
        return jsonResponse(401, {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'E-mail ou senha inválidos.',
          },
        });
      }

      const token = signToken({ sub: user.id });

      return jsonResponse(200, {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
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

      context.error('Unexpected error on auth/login function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível autenticar agora. Tente novamente em instantes.',
        },
      });
    }
  },
});
