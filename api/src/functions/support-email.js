const { app } = require('@azure/functions');

const FEEDBACK_LABELS = {
  suggestion: 'Sugestão',
  issue: 'Erro',
  compliment: 'Elogio',
};

const DEFAULT_SUPPORT_RECIPIENT = 'sgldeveloper@outlook.com';
const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_ALLOWED_ORIGIN = process.env.SUPPORT_EMAIL_ALLOWED_ORIGIN || '*';

function createCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': DEFAULT_ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };
}

function createJsonResponse(status, body) {
  return {
    status,
    jsonBody: body,
    headers: {
      'Content-Type': 'application/json',
      ...createCorsHeaders(),
    },
  };
}

function resolveResendConfig() {
  const apiKey = process.env.SUPPORT_EMAIL_API_KEY || process.env.RESEND_API_KEY || '';
  const from = process.env.SUPPORT_EMAIL_FROM || '';
  const to = process.env.SUPPORT_EMAIL_TO || DEFAULT_SUPPORT_RECIPIENT;

  if (!apiKey.trim()) {
    return { ok: false, message: 'A chave da API de e-mail (SUPPORT_EMAIL_API_KEY) não está configurada.' };
  }

  if (!from.trim()) {
    return {
      ok: false,
      message: 'O remetente padrão não está configurado. Defina SUPPORT_EMAIL_FROM com um remetente verificado.',
    };
  }

  const recipients = to
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return {
      ok: false,
      message: 'Nenhum destinatário configurado para receber as mensagens de suporte.',
    };
  }

  return {
    ok: true,
    value: {
      apiKey: apiKey.trim(),
      from: from.trim(),
      to: recipients,
    },
  };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return match;
    }
  });
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendViaResend(config, payload, context) {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.';

    try {
      const data = await response.json();
      const candidate = data?.message || data?.error || data?.error?.message;
      if (typeof candidate === 'string' && candidate.trim()) {
        message = candidate.trim();
      }
    } catch (error) {
      context.warn('Failed to parse Resend error response', error);
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
}

app.http('support-email', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return {
        status: 204,
        headers: createCorsHeaders(),
      };
    }

    const resendConfig = resolveResendConfig();

    if (!resendConfig.ok) {
      context.error('Support email configuration error', resendConfig.message);
      return createJsonResponse(500, {
        error: {
          message:
            'O envio automático de e-mails não está configurado corretamente. Entre em contato com o administrador do sistema.',
        },
      });
    }

    let payload;

    try {
      payload = await request.json();
    } catch (error) {
      context.warn('Failed to parse support email payload as JSON', error);
      return createJsonResponse(400, {
        error: {
          message: 'O corpo da requisição deve ser um JSON válido.',
        },
      });
    }

    const typeRaw = typeof payload?.type === 'string' ? payload.type : 'suggestion';
    const type = Object.prototype.hasOwnProperty.call(FEEDBACK_LABELS, typeRaw) ? typeRaw : 'suggestion';
    const typeLabel = FEEDBACK_LABELS[type];

    const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
    const contact = typeof payload?.contact === 'string' ? payload.contact.trim() : '';
    const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

    if (!message) {
      return createJsonResponse(400, {
        error: {
          message: 'Descreva sua mensagem antes de enviar.',
        },
      });
    }

    if (message.length > 5000) {
      return createJsonResponse(400, {
        error: {
          message: 'A mensagem pode ter no máximo 5000 caracteres.',
        },
      });
    }

    if (name.length > 120) {
      return createJsonResponse(400, {
        error: {
          message: 'O nome pode ter no máximo 120 caracteres.',
        },
      });
    }

    if (contact.length > 256) {
      return createJsonResponse(400, {
        error: {
          message: 'O contato pode ter no máximo 256 caracteres.',
        },
      });
    }

    const textParts = [
      `Tipo: ${typeLabel}`,
      name ? `Nome: ${name}` : null,
      contact ? `Contato: ${contact}` : null,
      '',
      message,
    ].filter(Boolean);

    const htmlParts = [
      `<p><strong>Tipo:</strong> ${escapeHtml(typeLabel)}</p>`,
      name ? `<p><strong>Nome:</strong> ${escapeHtml(name)}</p>` : '',
      contact ? `<p><strong>Contato:</strong> ${escapeHtml(contact)}</p>` : '',
      '<hr />',
      `<p style="white-space: pre-wrap;">${escapeHtml(message)}</p>`,
    ].filter(Boolean);

    const replyTo = contact && isLikelyEmail(contact) ? contact : undefined;

    try {
      await sendViaResend(
        resendConfig.value,
        {
          from: resendConfig.value.from,
          to: resendConfig.value.to,
          subject: `Suporte Daily Prayers - ${typeLabel}`,
          text: textParts.join('\n'),
          html: htmlParts.join('\n'),
          reply_to: replyTo,
        },
        context
      );

      return createJsonResponse(200, { success: true });
    } catch (error) {
      context.error('Failed to deliver support email', error);
      return createJsonResponse(error.status === 401 ? 401 : 502, {
        error: {
          message:
            error instanceof Error && error.message
              ? error.message
              : 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.',
        },
      });
    }
  },
});
