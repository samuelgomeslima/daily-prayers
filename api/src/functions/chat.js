const { app } = require('@azure/functions');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.http('chat', {
  methods: ['POST'],
  authLevel: 'anonymous',
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

    const { messages, temperature = 0.6 } = body ?? {};

    if (!Array.isArray(messages)) {
      return {
        status: 400,
        jsonBody: {
          error: {
            message: 'The request body must include a "messages" array.',
          },
        },
      };
    }

    try {
      const response = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        context.warn('OpenAI API returned an error response.', data);
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
      context.error('Unexpected error calling OpenAI API.', error);
      return {
        status: 500,
        jsonBody: {
          error: {
            message: 'Unable to contact the AI service right now. Please try again later.',
          },
        },
      };
    }
  },
});
