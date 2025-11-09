const { app } = require('@azure/functions');
const { randomUUID } = require('node:crypto');
const { z } = require('zod');

const { jsonResponse, readJson } = require('../lib/http');
const { requireAuthenticatedUser } = require('../lib/auth-middleware');
const { query } = require('../lib/db');

const FREQUENCIES = ['daily', 'weekly', 'monthly'];

const DEFAULT_PRACTICES = [
  {
    id: 'morning-prayer',
    title: 'Oração da manhã',
    description: 'Ao acordar, ofereça todo o dia a Deus com uma oração de entrega.',
    frequency: 'daily',
  },
  {
    id: 'biblical-reading',
    title: 'Leitura da Bíblia',
    description: 'Separe 10 a 15 minutos para meditar um trecho das Escrituras.',
    frequency: 'daily',
  },
  {
    id: 'silent-meditation',
    title: 'Meditação silenciosa',
    description: 'Dedique alguns minutos de silêncio para aprofundar a Palavra rezada.',
    frequency: 'daily',
  },
  {
    id: 'rosary-prayer',
    title: 'Terço ou Rosário',
    description: 'Reze ao menos um terço diariamente, meditando os mistérios com calma.',
    frequency: 'daily',
  },
  {
    id: 'night-prayer',
    title: 'Oração da noite',
    description: 'Antes de dormir, faça exame de consciência e agradeça as graças do dia.',
    frequency: 'daily',
  },
  {
    id: 'holy-mass',
    title: 'Santa Missa',
    description: 'Participe da Eucaristia aos domingos e, se possível, em um dia extra.',
    frequency: 'weekly',
  },
  {
    id: 'adoration',
    title: 'Adoração ao Santíssimo',
    description: 'Faça uma visita semanal a Jesus no Sacrário para permanecer em silêncio com Ele.',
    frequency: 'weekly',
  },
  {
    id: 'mercy-works',
    title: 'Obra de misericórdia',
    description: 'Realize um gesto concreto de caridade por semana, oferecendo seu tempo e atenção.',
    frequency: 'weekly',
  },
  {
    id: 'confession',
    title: 'Confissão',
    description: 'Procure o sacramento da Reconciliação com frequência e prepare-se com calma.',
    frequency: 'monthly',
  },
  {
    id: 'spiritual-direction',
    title: 'Direção espiritual',
    description: 'Encontre-se com seu diretor espiritual para discernir passos de crescimento.',
    frequency: 'monthly',
  },
];

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  frequency: z.enum(FREQUENCIES),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  frequency: z.enum(FREQUENCIES).optional(),
  completedPeriods: z.array(z.string()).optional(),
});

async function ensureDefaultPractices(userId) {
  const existing = await query(
    'select id from life_plan_practices where user_id = $1 limit 1',
    [userId]
  );

  if (existing.rowCount > 0) {
    return;
  }

  const inserts = DEFAULT_PRACTICES.map((practice) =>
    query(
      `insert into life_plan_practices (id, user_id, title, description, frequency, is_default)
       values ($1, $2, $3, $4, $5, true)
       on conflict (id, user_id) do nothing`,
      [practice.id, userId, practice.title, practice.description ?? null, practice.frequency]
    )
  );

  await Promise.all(inserts);
}

async function getPractices(userId) {
  const result = await query(
    `select id, title, description, frequency, is_default as "isDefault",
            coalesce(completed_periods, '{}') as "completedPeriods",
            created_at as "createdAt", updated_at as "updatedAt"
     from life_plan_practices
     where user_id = $1
     order by created_at asc`,
    [userId]
  );

  return result.rows.map((row) => ({
    ...row,
    completedPeriods: Array.isArray(row.completedPeriods)
      ? row.completedPeriods
      : [],
  }));
}

app.http('life-plan', {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  authLevel: 'anonymous',
  route: 'life-plan/{practiceId?}',
  handler: async (request, context) => {
    let auth;

    try {
      auth = await requireAuthenticatedUser(request);
    } catch (error) {
      if (error.name === 'UnauthorizedError') {
        return jsonResponse(401, {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Faça login para acessar seu plano de vida.',
          },
        });
      }

      context.error('Unexpected authentication error on life-plan function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível validar sua sessão agora.',
        },
      });
    }

    const practiceId = request.params.get('practiceId');

    try {
      if (request.method === 'GET') {
        await ensureDefaultPractices(auth.user.id);
        const practices = await getPractices(auth.user.id);
        return jsonResponse(200, { practices });
      }

      if (request.method === 'POST') {
        const payload = await readJson(request);
        const data = createSchema.parse(payload);

        const result = await query(
          `insert into life_plan_practices (id, user_id, title, description, frequency, is_default)
           values ($1, $2, $3, $4, $5, false)
           returning id, title, description, frequency, is_default as "isDefault",
                     coalesce(completed_periods, '{}') as "completedPeriods",
                     created_at as "createdAt", updated_at as "updatedAt"`,
          [randomUUID(), auth.user.id, data.title.trim(), data.description?.trim() ?? null, data.frequency]
        );

        const practice = result.rows[0];
        practice.completedPeriods = [];

        return jsonResponse(201, { practice });
      }

      if (request.method === 'PUT') {
        if (!practiceId) {
          return jsonResponse(400, {
            error: {
              code: 'MISSING_PRACTICE_ID',
              message: 'Informe o identificador da prática que deseja atualizar.',
            },
          });
        }

        const payload = await readJson(request);
        const descriptionProvided = Object.prototype.hasOwnProperty.call(payload, 'description');
        const data = updateSchema.parse(payload);

        const descriptionValue = descriptionProvided
          ? data.description?.trim() ?? null
          : undefined;

        const result = await query(
          `update life_plan_practices
              set title = coalesce($3, title),
                  description = case when $7 then $4 else description end,
                  frequency = coalesce($5, frequency),
                  completed_periods = coalesce($6, completed_periods),
                  updated_at = now()
            where id = $1 and user_id = $2
            returning id, title, description, frequency, is_default as "isDefault",
                      coalesce(completed_periods, '{}') as "completedPeriods",
                      created_at as "createdAt", updated_at as "updatedAt"`,
          [
            practiceId,
            auth.user.id,
            data.title?.trim() ?? null,
            descriptionValue ?? null,
            data.frequency ?? null,
            Array.isArray(data.completedPeriods) ? data.completedPeriods : null,
            descriptionProvided,
          ]
        );

        const updated = result.rows[0];

        if (!updated) {
          return jsonResponse(404, {
            error: {
              code: 'PRACTICE_NOT_FOUND',
              message: 'Não encontramos a prática para atualizar.',
            },
          });
        }

        updated.completedPeriods = Array.isArray(updated.completedPeriods)
          ? updated.completedPeriods
          : [];

        return jsonResponse(200, { practice: updated });
      }

      if (request.method === 'DELETE') {
        if (!practiceId) {
          return jsonResponse(400, {
            error: {
              code: 'MISSING_PRACTICE_ID',
              message: 'Informe o identificador da prática que deseja remover.',
            },
          });
        }

        const result = await query(
          `delete from life_plan_practices
             where id = $1 and user_id = $2 and is_default = false
           returning id`,
          [practiceId, auth.user.id]
        );

        if (result.rowCount === 0) {
          return jsonResponse(404, {
            error: {
              code: 'PRACTICE_NOT_FOUND',
              message: 'Não encontramos a prática para remoção ou ela faz parte do conjunto padrão.',
            },
          });
        }

        return jsonResponse(204, undefined);
      }

      return jsonResponse(405, {
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Método não suportado para /life-plan.',
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

      context.error('Unexpected error on life-plan function', error);
      return jsonResponse(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível processar a solicitação agora. Tente novamente em instantes.',
        },
      });
    }
  },
});
