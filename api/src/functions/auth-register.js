const { app } = require('@azure/functions');
const { randomBytes, randomUUID } = require('node:crypto');

const { ensureSchema } = require('../db/schema');
const { execute } = require('../db/neon-client');
const { hashPassword } = require('../utils/passwords');
const { json, readJsonBody } = require('../utils/http');
const { sendEmail } = require('../utils/mailer');

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'O corpo da requisição deve ser um objeto JSON.';
  }

  const { email, password, name } = payload;

  if (typeof email !== 'string' || !email.includes('@')) {
    return 'Informe um e-mail válido.';
  }

  if (typeof password !== 'string' || password.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }

  if (name != null && typeof name !== 'string') {
    return 'O nome informado é inválido.';
  }

  return null;
}

async function buildAndSendEmail({ email, name, token }) {
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8081';
  const apiBaseUrl = process.env.API_BASE_URL || appBaseUrl;
  const confirmationUrl = `${appBaseUrl.replace(/\/$/, '')}/confirm-email?token=${token}`;
  const fallbackApiUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/auth-confirm?token=${token}`;

  const greetingName = name ? name.trim() : 'irmão(ã)';
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h1>Bem-vindo(a) ao Daily Prayers!</h1>
      <p>Olá, ${greetingName}! Estamos felizes em acompanhar sua jornada de oração.</p>
      <p>Para concluir seu cadastro, confirme o endereço de e-mail clicando no botão abaixo:</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${confirmationUrl}" style="background: #2563EB; color: #fff; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Confirmar e-mail
        </a>
      </p>
      <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
      <p>Você também pode confirmar diretamente pela API utilizando o link abaixo:</p>
      <p><a href="${fallbackApiUrl}">${fallbackApiUrl}</a></p>
      <p style="margin-top: 40px;">Paz e bem!<br/>Equipe Daily Prayers</p>
    </div>
  `;

  const text = [
    'Bem-vindo(a) ao Daily Prayers!',
    `Olá, ${greetingName}!`,
    'Para concluir seu cadastro, confirme seu e-mail acessando o link abaixo:',
    confirmationUrl,
    '',
    'Se preferir, utilize o endpoint da API:',
    fallbackApiUrl,
    '',
    'Paz e bem!',
    'Equipe Daily Prayers',
  ].join('\n');

  await sendEmail({
    to: email,
    subject: 'Confirme seu e-mail no Daily Prayers',
    html,
    text,
  });
}

function buildErrorResponse(error) {
  const fallback = {
    status: 500,
    body: {
      error: 'Não foi possível concluir o cadastro agora. Tente novamente em instantes.',
    },
  };

  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message || 'Erro desconhecido.';

  if (message.includes('NEON_DATABASE_URL is not configured')) {
    return {
      status: 500,
      body: {
        error:
          'A variável de ambiente NEON_DATABASE_URL não está configurada. Defina-a com a string de conexão do banco Neon.',
      },
    };
  }

  if (message.includes('Invalid NEON_DATABASE_URL')) {
    return {
      status: 500,
      body: {
        error:
          'O valor de NEON_DATABASE_URL é inválido. Utilize uma URL no formato postgresql://usuario:senha@host/banco.',
      },
    };
  }

  if (/Failed to parse response from Neon/i.test(message)) {
    return {
      status: 500,
      body: {
        error:
          'O retorno do banco Neon não pôde ser interpretado. Verifique o projeto, permissões e o endpoint configurado.',
      },
    };
  }

  if (/fetch failed/i.test(message) || /Unexpected Neon error/i.test(message)) {
    return {
      status: 500,
      body: {
        error:
          'Não foi possível conectar ao banco de dados Neon. Confirme a URL, as credenciais e a disponibilidade do serviço.',
      },
    };
  }

  return {
    status: 500,
    body: {
      error: `Erro ao registrar usuário: ${message}`,
    },
  };
}

app.http('auth-register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    await ensureSchema();

    const body = await readJsonBody(request);
    const validationError = validatePayload(body);

    if (validationError) {
      return json(400, { error: validationError });
    }

    const normalizedEmail = body.email.trim().toLowerCase();
    const name = typeof body.name === 'string' ? body.name.trim() : null;

    try {
      const { rows: existingUsers } = await execute(
        'SELECT id, email_confirmed_at FROM users WHERE email = $1 LIMIT 1',
        [normalizedEmail]
      );

      const passwordHash = hashPassword(body.password);
      const confirmationToken = randomBytes(32).toString('hex');
      const timestamp = new Date().toISOString();

      if (existingUsers.length > 0) {
        const existing = existingUsers[0];

        if (existing.email_confirmed_at) {
          return json(409, {
            error: 'Este e-mail já está cadastrado. Faça login ou solicite a redefinição da senha.',
          });
        }

        await execute(
          `UPDATE users
             SET password_hash = $1,
                 name = $2,
                 email_confirmation_token = $3,
                 email_confirmation_sent_at = $4,
                 email_confirmed_at = NULL,
                 updated_at = NOW()
           WHERE id = $5`,
          [passwordHash, name, confirmationToken, timestamp, existing.id]
        );
      } else {
        const id = randomUUID();
        await execute(
          `INSERT INTO users (id, email, password_hash, name, email_confirmation_token, email_confirmation_sent_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, normalizedEmail, passwordHash, name, confirmationToken, timestamp]
        );
      }

      try {
        await buildAndSendEmail({ email: normalizedEmail, name, token: confirmationToken });
      } catch (error) {
        context.error('Não foi possível enviar o e-mail de confirmação.', error);
        return json(201, {
          message:
            'Usuário cadastrado, mas houve um problema ao enviar o e-mail de confirmação. Solicite um novo e-mail de confirmação mais tarde.',
          details: error instanceof Error ? error.message : undefined,
        });
      }

      return json(201, {
        message: 'Cadastro realizado com sucesso. Verifique seu e-mail para confirmar a conta.',
      });
    } catch (error) {
      context.error('Erro ao registrar usuário', error);
      const { status, body } = buildErrorResponse(error);
      return json(status, body);
    }
  },
});
