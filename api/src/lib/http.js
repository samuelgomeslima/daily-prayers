function jsonResponse(status, body) {
  return {
    status,
    jsonBody: body,
  };
}

async function readJson(request) {
  try {
    const data = await request.json();
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON payload.';
    const parseError = new Error(message);
    parseError.name = 'BadRequestError';
    throw parseError;
  }
}

function getAuthorizationToken(request) {
  const header = request.headers.get('authorization');
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

module.exports = {
  jsonResponse,
  readJson,
  getAuthorizationToken,
};
