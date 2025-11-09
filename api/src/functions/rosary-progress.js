const { app } = require('@azure/functions');
const { z } = require('zod');

const { jsonResponse, readJson } = require('../lib/http');
const { requireAuthenticatedUser } = require('../lib/auth-middleware');
const { query } = require('../lib/db');

const stateSchema = z.object({
  markedIds: z.array(z.string()),
  roundsCompleted: z.number().int().min(0),
  targetRounds: z.number().int().min(1),
});

app.http('rosary-progress', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'rosary-progress/{sequenceId?}',
  handler: async (request, context) => {
    let auth;

    try {
      auth = await requireAuthenticatedUser(request);
    } catch (error) {
      if (error.name === 'UnauthorizedError') {
        return jsonResponse(401, {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Faça login para sincronizar o progresso dos terços.',
          },
        });
      }

      context.error('Unexpected authentication error on rosary-progress function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível validar sua sessão agora.',
        },
      });
    }

    const sequenceId = request.params.get('sequenceId');

    try {
      if (request.method === 'GET') {
        const result = await query(
          `select sequence_id as "sequenceId", state, updated_at as "updatedAt"
             from rosary_progress
            where user_id = $1`,
          [auth.user.id]
        );

        return jsonResponse(200, { progress: result.rows });
      }

      if (request.method === 'PUT') {
        if (!sequenceId) {
          return jsonResponse(400, {
            error: {
              code: 'MISSING_SEQUENCE_ID',
              message: 'Informe o identificador da sequência que deseja atualizar.',
            },
          });
        }

        const payload = await readJson(request);
        const data = stateSchema.parse(payload);

        await query(
          `insert into rosary_progress (user_id, sequence_id, state)
             values ($1, $2, $3)
             on conflict (user_id, sequence_id)
             do update set state = excluded.state, updated_at = now()`,
          [auth.user.id, sequenceId, data]
        );

        return jsonResponse(204, undefined);
      }

      return jsonResponse(405, {
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Método não suportado para /rosary-progress.',
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

      context.error('Unexpected error on rosary-progress function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível processar a solicitação agora. Tente novamente em instantes.',
        },
      });
    }
  },
});
