function json(status, body) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function getBearerToken(request) {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

module.exports = {
  json,
  readJsonBody,
  getBearerToken,
};
