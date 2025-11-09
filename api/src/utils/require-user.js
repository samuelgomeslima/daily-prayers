const { verifyToken } = require('./auth');
const { unauthorized } = require('./http');
const { getUserById } = require('../repositories/users');

async function requireUser(request, context) {
  const authorizationHeader = request.headers.get('authorization') || request.headers.get('Authorization');

  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return { error: unauthorized('É necessário estar autenticado para acessar este recurso.') };
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return { error: unauthorized('Formato de token inválido. Utilize o esquema Bearer.') };
  }

  const token = match[1].trim();

  try {
    const payload = verifyToken(token);
    const userId = payload.sub;

    if (typeof userId !== 'string' || userId.length === 0) {
      return { error: unauthorized('Token de acesso inválido.') };
    }

    const user = await getUserById(userId);

    if (!user) {
      return { error: unauthorized('Usuário não encontrado ou token expirado.') };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName || null,
      },
      token,
      tokenPayload: payload,
    };
  } catch (error) {
    if (context && typeof context.warn === 'function') {
      context.warn('Falha ao validar token de autenticação.', error);
    }

    return { error: unauthorized('Sua sessão expirou. Faça login novamente.') };
  }
}

module.exports = {
  requireUser,
};
