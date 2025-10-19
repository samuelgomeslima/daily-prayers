const { app } = require('@azure/functions');
const { Buffer } = require('node:buffer');

const OPENAI_TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';

const guessExtension = (mimeType) => {
  if (typeof mimeType !== 'string') {
    return 'm4a';
  }

  const normalized = mimeType.toLowerCase();

  if (normalized.includes('wav')) {
    return 'wav';
  }

  if (normalized.includes('mpeg')) {
    return 'mp3';
  }

  if (normalized.includes('3gpp')) {
    return '3gp';
  }

  if (normalized.includes('aac')) {
    return 'aac';
  }

  if (normalized.includes('ogg')) {
    return 'ogg';
  }

  return 'm4a';
};

const createTranscriptionRequest = async ({ audio, mimeType }) => {
  if (typeof audio !== 'string' || audio.trim().length === 0) {
    throw new Error('A valid base64 audio payload is required.');
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not configured.');
  }

  const safeMimeType = typeof mimeType === 'string' && mimeType.trim().length > 0 ? mimeType : 'audio/mp4';
  const extension = guessExtension(safeMimeType);
  const audioBuffer = Buffer.from(audio, 'base64');

  const blob = new Blob([audioBuffer], { type: safeMimeType });
  const formData = new FormData();

  formData.append('file', blob, `recording.${extension}`);
  formData.append('model', OPENAI_TRANSCRIBE_MODEL);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const errorMessage =
      errorPayload?.error?.message ||
      `OpenAI transcription request failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  const payload = await response.json();
  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

  if (!text) {
    throw new Error('Transcription result did not include any text.');
  }

  return text;
};

app.http('catechistTranscribe', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'catechist-transcribe',
  handler: async (request, context) => {
    let body;

    try {
      body = await request.json();
    } catch (error) {
      context.warn('Failed to parse transcription request body as JSON.', error);
      return {
        status: 400,
        jsonBody: {
          error: {
            message: 'Invalid JSON payload in request body.',
          },
        },
      };
    }

    const { audio, mimeType } = body ?? {};

    if (typeof audio !== 'string' || audio.trim().length === 0) {
      return {
        status: 400,
        jsonBody: {
          error: {
            message: 'The request body must include a non-empty "audio" string.',
          },
        },
      };
    }

    try {
      const text = await createTranscriptionRequest({ audio, mimeType });

      return {
        status: 200,
        jsonBody: {
          text,
        },
      };
    } catch (error) {
      context.error('Failed to transcribe catechist audio input.', error);

      return {
        status: 500,
        jsonBody: {
          error: {
            message: error instanceof Error ? error.message : 'Unable to transcribe the provided audio.',
          },
        },
      };
    }
  },
});

module.exports = {
  createTranscriptionRequest,
};
