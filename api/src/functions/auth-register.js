const { app } = require('@azure/functions');
const { randomUUID } = require('node:crypto');
const { z } = require('zod');

const { jsonResponse, readJson } = require('../lib/http');
const { hashPassword } = require('../lib/password');
const { createUser, findUserByEmail } = require('../lib/users');
const { signToken } = require('../lib/jwt');

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

app.http('auth-register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: async (request, context) => {
    try {
      const payload = await readJson(request);
      const data = schema.parse(payload);

      const existing = await findUserByEmail(data.email.toLowerCase());
      if (existing) {
        return jsonResponse(409, {
          error: {
            code: 'EMAIL_IN_USE',
            message: 'Já existe uma conta registrada com este e-mail.',
          },
        });
      }

      const passwordHash = await hashPassword(data.password);
      const createdUser = await createUser({
        id: randomUUID(),
        email: data.email.toLowerCase(),
        name: data.name.trim(),
        passwordHash,
      });

      const token = signToken({ sub: createdUser.id });

      return jsonResponse(201, {
        token,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
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

      context.error('Unexpected error on auth/register function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível completar o cadastro agora. Tente novamente em instantes.',
        },
      });
    }
  },
});
