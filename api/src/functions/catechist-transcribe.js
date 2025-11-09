const { app } = require('@azure/functions');
const { Buffer } = require('node:buffer');

const { requireUser } = require('../utils/require-user');

app.http('catechistTranscribe', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'catechist-transcribe',
  handler: async (request, context) => {
    const method = (request?.method || 'GET').toUpperCase();
    const authResult = await requireUser(request, context);

    if (authResult.error) {
      return authResult.error;
    }
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_TRANSCRIBE_MODEL =
      process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';
    const OPENAI_PROXY_TOKEN = process.env.OPENAI_PROXY_TOKEN || null;

    const jsonResponse = (status, body) => ({
      status,
      jsonBody: body,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    const getHeader = (req, name) => req?.headers?.get(name) || null;

    const getProvidedToken = (req) => {
      const headerToken = getHeader(req, 'authorization');

      if (headerToken && headerToken.toLowerCase().startsWith('bearer ')) {
        return headerToken.substring(7).trim();
      }

      const queryToken = req?.query?.get('token');
      return queryToken ? queryToken.trim() : null;
    };

    const readBufferBody = async (req) => {
      try {
        const arrayBuffer = await req.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (error) {
        context.error('Failed to read incoming transcription payload.', error);
        return null;
      }
    };

    const providedToken = getProvidedToken(request);

    if (method === 'GET') {
      if (!OPENAI_API_KEY) {
        context.warn('Missing OPENAI_API_KEY environment variable.');
        return jsonResponse(503, {
          ok: false,
          error: {
            message: 'The OpenAI API key is not configured on the server.',
          },
        });
      }

      if (OPENAI_PROXY_TOKEN && (!providedToken || providedToken !== OPENAI_PROXY_TOKEN)) {
        return jsonResponse(401, {
          ok: false,
          error: {
            message: 'Unauthorized request.',
          },
        });
      }

      return jsonResponse(200, {
        ok: true,
        message: 'Transcription proxy is ready.',
        model: OPENAI_TRANSCRIBE_MODEL,
      });
    }

    if (method !== 'POST') {
      return jsonResponse(405, {
        error: {
          message: 'Method not allowed.',
        },
      });
    }

    if (!OPENAI_API_KEY) {
      context.warn('Missing OPENAI_API_KEY environment variable.');
      return jsonResponse(500, {
        error: {
          message: 'The OpenAI API key is not configured on the server.',
        },
      });
    }

    if (OPENAI_PROXY_TOKEN && (!providedToken || providedToken !== OPENAI_PROXY_TOKEN)) {
      return jsonResponse(401, {
        error: {
          message: 'Unauthorized request.',
        },
      });
    }

    const contentType = getHeader(request, 'content-type');

    if (!contentType || !contentType.toLowerCase().startsWith('multipart/form-data')) {
      return jsonResponse(400, {
        error: {
          message: 'Requests must be sent as multipart/form-data.',
        },
      });
    }

    const rawBody = await readBufferBody(request);

    if (!rawBody || rawBody.length === 0) {
      return jsonResponse(400, {
        error: {
          message: 'Request body is missing or invalid.',
        },
      });
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': contentType,
        },
        body: rawBody,
      });

      const responseText = await response.text();
      let data = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (error) {
        context.error('Transcription API did not return JSON.', error);
        return jsonResponse(502, {
          error: {
            message: 'Unexpected response from the OpenAI transcription service.',
          },
        });
      }

      if (!response.ok) {
        context.warn('OpenAI transcription failed.', data);
        return {
          status: response.status,
          jsonBody: data,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        };
      }

      return jsonResponse(200, data);
    } catch (error) {
      context.error('Unexpected error calling OpenAI transcription.', error);
      return jsonResponse(500, {
        error: {
          message: 'Unable to contact the transcription service right now.',
        },
      });
    }
  },
});

module.exports = {};
