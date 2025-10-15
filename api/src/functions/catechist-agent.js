const { app } = require('@azure/functions');

const { runCatechistAgent } = require('../workflows/catechist-agent-workflow');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.OPENAI_CATECHIST_AGENT_ID ?? null;

const inferOutputText = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const extractFromArray = (segments) => {
    if (!Array.isArray(segments)) {
      return null;
    }

    for (const segment of segments) {
      if (!segment || typeof segment !== 'object') {
        continue;
      }

      if (typeof segment.output_text === 'string' && segment.output_text.trim()) {
        return segment.output_text.trim();
      }

      if (typeof segment.text === 'string' && segment.text.trim()) {
        return segment.text.trim();
      }

      if (Array.isArray(segment.content)) {
        for (const content of segment.content) {
          if (!content || typeof content !== 'object') {
            continue;
          }

          if (typeof content.text === 'string' && content.text.trim()) {
            return content.text.trim();
          }

          if (typeof content.value === 'string' && content.value.trim()) {
            return content.value.trim();
          }
        }
      }
    }

    return null;
  };

  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (typeof payload.final_output === 'string' && payload.final_output.trim()) {
    return payload.final_output.trim();
  }

  return (
    extractFromArray(payload.output) ??
    extractFromArray(payload.outputs) ??
    extractFromArray(payload.response?.output) ??
    (typeof payload.response?.output_text === 'string'
      ? payload.response.output_text.trim()
      : null)
  );
};

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return [];
  }

  const sanitized = [];

  for (const entry of history) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const role = entry.role === 'assistant' ? 'assistant' : 'user';
    const rawText =
      typeof entry.text === 'string'
        ? entry.text
        : typeof entry.content === 'string'
          ? entry.content
          : '';

    const text = rawText.trim();

    if (!text) {
      continue;
    }

    sanitized.push({ role, text });
  }

  return sanitized;
};

const normalizeAgentResponse = (raw, fallbackConversationId) => {
  if (!raw || typeof raw !== 'object') {
    return {
      output_text: null,
    };
  }

  const conversationId =
    raw.conversation?.id ??
    raw.conversation_id ??
    raw.response?.conversation_id ??
    fallbackConversationId ??
    null;

  const outputText = inferOutputText(raw);

  return {
    ...raw,
    conversation_id: conversationId ?? undefined,
    output_text: outputText ?? undefined,
    final_output: typeof raw.final_output === 'string' ? raw.final_output : outputText ?? undefined,
  };
};

app.http('catechistAgent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'catechist-agent',
  handler: async (request, context) => {
    if (!OPENAI_API_KEY) {
      context.warn('Missing OPENAI_API_KEY environment variable.');
      return {
        status: 500,
        jsonBody: {
          error: {
            message: 'The OpenAI API key is not configured on the server.',
          },
        },
      };
    }

    if (!WORKFLOW_ID) {
      context.warn('Missing OPENAI_CATECHIST_AGENT_ID environment variable.');
      return {
        status: 500,
        jsonBody: {
          error: {
            message:
              'The catechist agent identifier is not configured. Define OPENAI_CATECHIST_AGENT_ID in your environment.',
          },
        },
      };
    }

    let body;

    try {
      body = await request.json();
    } catch (error) {
      context.warn('Failed to parse request body as JSON.', error);
      return {
        status: 400,
        jsonBody: {
          error: {
            message: 'Invalid JSON payload in request body.',
          },
        },
      };
    }

    const { message, conversationId, history } = body ?? {};
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';
    const normalizedHistory = sanitizeHistory(history);

    if (!trimmedMessage) {
      return {
        status: 400,
        jsonBody: {
          error: {
            message: 'The request body must include a non-empty "message" string.',
          },
        },
      };
    }

    try {
      const agentResult = await runCatechistAgent({
        message: trimmedMessage,
        history: normalizedHistory,
      });

      const normalizedResponse = normalizeAgentResponse(agentResult, conversationId ?? undefined);
      const assistantText = normalizedResponse.output_text;

      if (!assistantText) {
        context.warn('Catechist agent returned an empty response.', agentResult);
        return {
          status: 502,
          jsonBody: {
            error: {
              message: 'The catechist agent did not produce a response. Try again later.',
            },
          },
        };
      }

      if (conversationId && !normalizedResponse.conversation_id) {
        normalizedResponse.conversation_id = conversationId;
      }

      return {
        status: 200,
        jsonBody: normalizedResponse,
      };
    } catch (error) {
      if (error?.code === 'MODULE_NOT_FOUND') {
        context.error('The @openai/agents package is required but could not be loaded.', error);
        return {
          status: 500,
          jsonBody: {
            error: {
              message:
                'The catechist agent runtime depends on the @openai/agents package. Install it in the API project and redeploy.',
            },
          },
        };
      }

      if (error instanceof Error && error.message === 'Conversation history is empty.') {
        return {
          status: 400,
          jsonBody: {
            error: {
              message: 'Unable to construct the catechist conversation history from the provided payload.',
            },
          },
        };
      }

      context.error('Unexpected error while running the catechist agent workflow.', error);
      return {
        status: 500,
        jsonBody: {
          error: {
            message: 'Unable to contact the catechist agent right now. Please try again later.',
          },
        },
      };
    }
  },
});
