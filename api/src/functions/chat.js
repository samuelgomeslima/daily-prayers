const { app } = require('@azure/functions');
const crypto = require('node:crypto');

const { getConversation, setConversation } = require('../utils/conversation-store');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_HISTORY_LENGTH = 40;

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((entry) => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }

      const { role, content } = entry;
      return (
        (role === 'user' || role === 'assistant') &&
        typeof content === 'string' &&
        content.trim().length > 0
      );
    })
    .map((entry) => ({ role: entry.role, content: entry.content }));
};

const limitHistory = (history) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.length > MAX_HISTORY_LENGTH ? history.slice(-MAX_HISTORY_LENGTH) : history;
};

const generateConversationId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `conv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

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

    const {
      messages,
      temperature = 0.6,
      conversationId: rawConversationId,
      userMessage,
      systemPrompt,
      agent,
    } = body ?? {};

    if (typeof userMessage === 'string' && typeof systemPrompt === 'string') {
      const trimmedPrompt = systemPrompt.trim();
      const trimmedUserMessage = userMessage.trim();

      if (!trimmedPrompt) {
        return {
          status: 400,
          jsonBody: {
            error: { message: 'The "systemPrompt" field must be a non-empty string.' },
          },
        };
      }

      if (!trimmedUserMessage) {
        return {
          status: 400,
          jsonBody: {
            error: { message: 'The "userMessage" field must be a non-empty string.' },
          },
        };
      }

      const normalizedAgent =
        typeof agent === 'string' && agent.trim().length > 0 ? agent.trim() : 'default';
      const normalizedTemperature = typeof temperature === 'number' ? temperature : 0.6;
      const conversationId =
        typeof rawConversationId === 'string' && rawConversationId.trim().length > 0
          ? rawConversationId.trim()
          : generateConversationId();

      const previousHistory = await getConversation(conversationId, normalizedAgent);
      const sanitizedHistory = limitHistory(normalizeHistory(previousHistory));
      const historyWithUser = limitHistory([
        ...sanitizedHistory,
        { role: 'user', content: trimmedUserMessage },
      ]);

      await setConversation(conversationId, normalizedAgent, historyWithUser);

      try {
        const response = await fetch(OPENAI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: trimmedPrompt },
              ...historyWithUser.map((entry) => ({ role: entry.role, content: entry.content })),
            ],
            temperature: normalizedTemperature,
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

        const assistantText = data?.choices?.[0]?.message?.content?.trim();

        if (!assistantText) {
          return {
            status: 502,
            jsonBody: {
              error: {
                message: 'The AI response did not include any content.',
              },
            },
          };
        }

        const finalHistory = limitHistory([
          ...historyWithUser,
          { role: 'assistant', content: assistantText },
        ]);

        await setConversation(conversationId, normalizedAgent, finalHistory);

        return {
          status: 200,
          jsonBody: {
            conversationId,
            message: { role: 'assistant', content: assistantText },
          },
        };
      } catch (error) {
        context.error('Unexpected error calling OpenAI API.', error);
        return {
          status: 500,
          jsonBody: {
            error: {
              message:
                'Unable to contact the AI service right now. Please try again later.',
            },
          },
        };
      }
    }

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
