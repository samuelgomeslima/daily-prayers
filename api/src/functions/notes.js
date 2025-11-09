const { app } = require('@azure/functions');
const { randomUUID } = require('node:crypto');
const { z } = require('zod');

const { jsonResponse, readJson } = require('../lib/http');
const { requireAuthenticatedUser } = require('../lib/auth-middleware');
const { query } = require('../lib/db');

const createSchema = z.object({
  title: z.string().trim().max(180).optional(),
  content: z.string().trim().max(5000).optional(),
});

const updateSchema = z.object({
  title: z.string().trim().max(180).optional(),
  content: z.string().trim().max(5000).optional(),
});

app.http('notes', {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  authLevel: 'anonymous',
  route: 'notes/{id?}',
  handler: async (request, context) => {
    let auth;

    try {
      auth = await requireAuthenticatedUser(request);
    } catch (error) {
      if (error.name === 'UnauthorizedError') {
        return jsonResponse(401, {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Faça login para acessar suas anotações.',
          },
        });
      }

      context.error('Unexpected authentication error on notes function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível validar sua sessão agora.',
        },
      });
    }

    const noteId = request.params.get('id');

    try {
      if (request.method === 'GET') {
        if (noteId) {
          const result = await query(
            `select id, title, content, created_at as "createdAt", updated_at as "updatedAt"
             from notes
             where id = $1 and user_id = $2`,
            [noteId, auth.user.id]
          );

          const note = result.rows[0];

          if (!note) {
            return jsonResponse(404, {
              error: {
                code: 'NOTE_NOT_FOUND',
                message: 'A anotação solicitada não foi encontrada.',
              },
            });
          }

          return jsonResponse(200, { note });
        }

        const result = await query(
          `select id, title, content, created_at as "createdAt", updated_at as "updatedAt"
           from notes
           where user_id = $1
           order by updated_at desc`,
          [auth.user.id]
        );

        return jsonResponse(200, { notes: result.rows });
      }

      if (request.method === 'POST') {
        const payload = await readJson(request);
        const data = createSchema.parse(payload);

        const normalizedTitle = data.title?.trim() ?? '';
        const normalizedContent = data.content?.trim() ?? '';

        if (!normalizedTitle && !normalizedContent) {
          return jsonResponse(400, {
            error: {
              code: 'EMPTY_NOTE',
              message: 'Informe ao menos um título ou conteúdo para salvar a anotação.',
            },
          });
        }

        const result = await query(
          `insert into notes (id, user_id, title, content)
           values ($1, $2, $3, $4)
           returning id, title, content, created_at as "createdAt", updated_at as "updatedAt"`,
          [randomUUID(), auth.user.id, normalizedTitle, normalizedContent]
        );

        return jsonResponse(201, { note: result.rows[0] });
      }

      if (request.method === 'PUT') {
        if (!noteId) {
          return jsonResponse(400, {
            error: {
              code: 'MISSING_NOTE_ID',
              message: 'Informe o identificador da anotação que deseja atualizar.',
            },
          });
        }

        const payload = await readJson(request);
        const data = updateSchema.parse(payload);

        const result = await query(
          `update notes
             set title = coalesce($3, title),
                 content = coalesce($4, content),
                 updated_at = now()
           where id = $1 and user_id = $2
           returning id, title, content, created_at as "createdAt", updated_at as "updatedAt"`,
          [noteId, auth.user.id, data.title?.trim() ?? null, data.content?.trim() ?? null]
        );

        const updated = result.rows[0];

        if (!updated) {
          return jsonResponse(404, {
            error: {
              code: 'NOTE_NOT_FOUND',
              message: 'Não encontramos a anotação para atualizar.',
            },
          });
        }

        return jsonResponse(200, { note: updated });
      }

      if (request.method === 'DELETE') {
        if (!noteId) {
          return jsonResponse(400, {
            error: {
              code: 'MISSING_NOTE_ID',
              message: 'Informe o identificador da anotação que deseja excluir.',
            },
          });
        }

        const result = await query(
          'delete from notes where id = $1 and user_id = $2 returning id',
          [noteId, auth.user.id]
        );

        if (result.rowCount === 0) {
          return jsonResponse(404, {
            error: {
              code: 'NOTE_NOT_FOUND',
              message: 'Não encontramos a anotação para exclusão.',
            },
          });
        }

        return jsonResponse(204, undefined);
      }

      return jsonResponse(405, {
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Método não suportado para /notes.',
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

      context.error('Unexpected error on notes function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível processar a solicitação agora. Tente novamente em instantes.',
        },
      });
    }
  },
});
