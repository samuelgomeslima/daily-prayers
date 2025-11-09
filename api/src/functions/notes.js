const { app } = require('@azure/functions');

const { createNote, listNotes, removeNote, updateNote } = require('../repositories/notes');
const { badRequest, jsonResponse, notFound, readJsonBody, serverError } = require('../utils/http');
const { requireUser } = require('../utils/require-user');

function sanitizeField(value) {
  return typeof value === 'string' ? value.trim() : '';
}

app.http('notes', {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  authLevel: 'anonymous',
  route: 'notes/{id?}',
  handler: async (request, context) => {
    const authResult = await requireUser(request, context);

    if (authResult.error) {
      return authResult.error;
    }

    const userId = authResult.user.id;
    const noteId = request.params.get('id');

    try {
      const method = (request.method || request.httpMethod || '').toUpperCase();

      switch (method) {
        case 'GET': {
          const notes = await listNotes(userId);
          return jsonResponse(200, { notes });
        }
        case 'POST': {
          let body;
          try {
            body = await readJsonBody(request);
          } catch (error) {
            context.warn('Falha ao interpretar JSON ao criar nota.', error);
            return badRequest('Envie os dados da anotação em formato JSON válido.');
          }

          const title = sanitizeField(body?.title ?? '');
          const content = sanitizeField(body?.content ?? '');

          if (!title && !content) {
            return badRequest('Informe um título ou conteúdo para a anotação.');
          }

          const created = await createNote(userId, { title, content });
          return jsonResponse(201, { note: created });
        }
        case 'PUT': {
          if (!noteId) {
            return badRequest('Informe o identificador da anotação a ser atualizada.');
          }

          let body;
          try {
            body = await readJsonBody(request);
          } catch (error) {
            context.warn('Falha ao interpretar JSON ao atualizar nota.', error);
            return badRequest('Envie os dados da anotação em formato JSON válido.');
          }

          const title = sanitizeField(body?.title ?? '');
          const content = sanitizeField(body?.content ?? '');

          if (!title && !content) {
            return badRequest('Informe um título ou conteúdo para a anotação.');
          }

          const updated = await updateNote(userId, noteId, { title, content });

          if (!updated) {
            return notFound('Anotação não encontrada.');
          }

          return jsonResponse(200, { note: updated });
        }
        case 'DELETE': {
          if (!noteId) {
            return badRequest('Informe o identificador da anotação a ser removida.');
          }

          const removed = await removeNote(userId, noteId);

          if (!removed) {
            return notFound('Anotação não encontrada.');
          }

          return { status: 204 };
        }
        default:
          return badRequest('Método HTTP não suportado.');
      }
    } catch (error) {
      context.error('Erro inesperado ao processar anotações.', error);
      return serverError('Não foi possível processar a solicitação das anotações. Tente novamente em instantes.');
    }
  },
});
