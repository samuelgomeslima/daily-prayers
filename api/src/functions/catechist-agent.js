const { app } = require('@azure/functions');

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CATECHIST_AGENT_ID = process.env.OPENAI_CATECHIST_AGENT_ID;

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

    if (!CATECHIST_AGENT_ID) {
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
      agent_id: CATECHIST_AGENT_ID,
      input: message,
    };

    if (conversationId) {
      payload.conversation = conversationId;
    }

    try {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'responses=v1',
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
        jsonBody: data,
      };
    } catch (error) {
      context.error('Unexpected error calling OpenAI Responses API for the catechist agent.', error);
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
