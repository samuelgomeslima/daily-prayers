function jsonResponse(status, body) {
  return {
    status,
    jsonBody: body,
  };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON payload.';
    throw new Error(`Failed to parse JSON body: ${message}`);
  }
}

function unauthorized(message = 'Authentication is required.') {
  return jsonResponse(401, {
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  });
}

function forbidden(message = 'You are not allowed to perform this action.') {
  return jsonResponse(403, {
    error: {
      code: 'FORBIDDEN',
      message,
    },
  });
}

function badRequest(message = 'The request is invalid.', details) {
  return jsonResponse(400, {
    error: {
      code: 'BAD_REQUEST',
      message,
      details,
    },
  });
}

function conflict(message = 'The resource already exists.', details) {
  return jsonResponse(409, {
    error: {
      code: 'CONFLICT',
      message,
      details,
    },
  });
}

function notFound(message = 'The requested resource was not found.') {
  return jsonResponse(404, {
    error: {
      code: 'NOT_FOUND',
      message,
    },
  });
}

function serverError(message = 'An unexpected error occurred.') {
  return jsonResponse(500, {
    error: {
      code: 'SERVER_ERROR',
      message,
    },
  });
}

module.exports = {
  badRequest,
  forbidden,
  jsonResponse,
  conflict,
  notFound,
  readJsonBody,
  serverError,
  unauthorized,
};
