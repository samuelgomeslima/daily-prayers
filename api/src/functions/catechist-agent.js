const { app } = require('@azure/functions');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.OPENAI_CATECHIST_AGENT_ID;

const buildWorkflowUrl = (workflowId) =>
  workflowId ? `https://api.openai.com/v1/workflows/${workflowId}/runs` : null;

const inferOutputText = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim().length > 0) {
    return payload.output_text.trim();
  }

  if (typeof payload.final_output === 'string' && payload.final_output.trim().length > 0) {
    return payload.final_output.trim();
  }

  const extractFromArray = (segments) => {
    if (!Array.isArray(segments)) {
      return null;
    }

    for (const segment of segments) {
      if (segment && typeof segment === 'object') {
        if (typeof segment.output_text === 'string' && segment.output_text.trim().length > 0) {
          return segment.output_text.trim();
        }

        if (typeof segment.text === 'string' && segment.text.trim().length > 0) {
          return segment.text.trim();
        }

        if (Array.isArray(segment.content)) {
          for (const content of segment.content) {
            if (content && typeof content === 'object') {
              if (typeof content.text === 'string' && content.text.trim().length > 0) {
                return content.text.trim();
              }

              if (typeof content.value === 'string' && content.value.trim().length > 0) {
                return content.value.trim();
              }
            }
          }
        }
      }
    }

    return null;
  };

  return (
    extractFromArray(payload.output) ??
    extractFromArray(payload.outputs) ??
    extractFromArray(payload.response?.output) ??
    (typeof payload.response?.output_text === 'string'
      ? payload.response.output_text.trim()
      : null)
  );
};

const normalizeWorkflowResponse = (raw, fallbackConversationId) => {
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
  };
};

const workflowUrl = buildWorkflowUrl(WORKFLOW_ID);

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

    if (!workflowUrl) {
      context.warn('Unable to resolve workflow URL for catechist agent.');
      return {
        status: 500,
        jsonBody: {
          error: {
            message: 'The catechist workflow identifier appears to be invalid.',
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

    const { message, conversationId } = body ?? {};

    if (typeof message !== 'string' || message.trim().length === 0) {
      return {
        status: 400,
        jsonBody: {
          error: {
            message: 'The request body must include a non-empty "message" string.',
          },
        },
      };
    }

    const payload = {
      input: {
        input_as_text: message,
      },
    };

    if (conversationId) {
      payload.conversation = conversationId;
    }

    try {
      const response = await fetch(workflowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'workflows=v1',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        context.warn('OpenAI API returned an error response for the catechist agent.', data);
        return {
          status: response.status,
          jsonBody: data,
        };
      }

      return {
        status: 200,
        jsonBody: normalizeWorkflowResponse(data, conversationId ?? undefined),
      };
    } catch (error) {
      context.error('Unexpected error calling OpenAI Workflows API for the catechist agent.', error);
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
