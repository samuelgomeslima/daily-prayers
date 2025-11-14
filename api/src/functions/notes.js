const { app } = require('@azure/functions');
const { randomUUID } = require('node:crypto');

const { query } = require('../lib/neon-client');
const { getUserFromAuthorization } = require('../lib/auth-utils');

function sanitizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

async function ensureAuthenticated(request) {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  const user = await getUserFromAuthorization(header);

  if (!user) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  return user;
}

app.http('notes', {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  authLevel: 'anonymous',
  route: 'notes/{id?}',
  handler: async (request, context) => {
    let user;

    try {
      user = await ensureAuthenticated(request);
    } catch (error) {
      return {
        status: error.statusCode ?? 401,
        jsonBody: { message: 'Você precisa estar autenticado para acessar as anotações.' },
      };
    }

    const method = request.method.toUpperCase();

    if (method === 'GET') {
      try {
        const result = await query(
          `SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = $1 ORDER BY updated_at DESC`,
          [user.id]
        );

        return {
          status: 200,
          jsonBody: { notes: Array.isArray(result.rows) ? result.rows : [] },
        };
      } catch (error) {
        context.error('Failed to list notes.', error);
        return {
          status: 500,
          jsonBody: { message: 'Não foi possível carregar as anotações.' },
        };
      }
    }

    if (method === 'POST') {
      let payload;

      try {
        payload = await request.json();
      } catch (error) {
        context.warn('Invalid JSON payload when creating note.', error);
        return {
          status: 400,
          jsonBody: { message: 'O corpo da requisição deve ser um JSON válido.' },
        };
      }

      const title = sanitizeText(payload?.title ?? '');
      const content = sanitizeText(payload?.content ?? '');

      if (!title && !content) {
        return {
          status: 400,
          jsonBody: { message: 'Informe um título ou conteúdo para salvar a anotação.' },
        };
      }

      const noteId = randomUUID();

      try {
        const result = await query(
          `INSERT INTO notes (id, user_id, title, content, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, title, content, created_at, updated_at`,
          [noteId, user.id, title, content]
        );

        const created = Array.isArray(result.rows) ? result.rows[0] : null;
        const fallbackTimestamp = new Date().toISOString();

        return {
          status: 201,
          jsonBody: {
            note:
              created ?? {
                id: noteId,
                title,
                content,
                created_at: fallbackTimestamp,
                updated_at: fallbackTimestamp,
              },
          },
        };
      } catch (error) {
        context.error('Failed to create note.', error);
        return {
          status: 500,
          jsonBody: { message: 'Não foi possível criar a anotação.' },
        };
      }
    }

    const noteId = request.params.get('id');

    if (!noteId) {
      return {
        status: 400,
        jsonBody: { message: 'Informe o identificador da anotação na URL.' },
      };
    }

    if (method === 'PUT') {
      let payload;

      try {
        payload = await request.json();
      } catch (error) {
        context.warn('Invalid JSON payload when updating note.', error);
        return {
          status: 400,
          jsonBody: { message: 'O corpo da requisição deve ser um JSON válido.' },
        };
      }

      const title = sanitizeText(payload?.title ?? '');
      const content = sanitizeText(payload?.content ?? '');

      if (!title && !content) {
        return {
          status: 400,
          jsonBody: { message: 'Informe um título ou conteúdo para atualizar a anotação.' },
        };
      }

      try {
        const result = await query(
          `UPDATE notes SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING id, title, content, created_at, updated_at`,
          [title, content, noteId, user.id]
        );

        const updated = Array.isArray(result.rows) ? result.rows[0] : null;

        if (!updated) {
          return {
            status: 404,
            jsonBody: { message: 'Anotação não encontrada.' },
          };
        }

        return {
          status: 200,
          jsonBody: { note: updated },
        };
      } catch (error) {
        context.error('Failed to update note.', error);
        return {
          status: 500,
          jsonBody: { message: 'Não foi possível atualizar a anotação.' },
        };
      }
    }

    if (method === 'DELETE') {
      try {
        const result = await query(
          `DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id`,
          [noteId, user.id]
        );

        const removed = Array.isArray(result.rows) ? result.rows[0] : null;

        if (!removed) {
          return {
            status: 404,
            jsonBody: { message: 'Anotação não encontrada.' },
          };
        }

        return {
          status: 204,
        };
      } catch (error) {
        context.error('Failed to delete note.', error);
        return {
          status: 500,
          jsonBody: { message: 'Não foi possível remover a anotação.' },
        };
      }
    }

    return {
      status: 405,
      jsonBody: { message: 'Método não suportado.' },
    };
  },
});
