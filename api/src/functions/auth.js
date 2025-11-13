const { app } = require('@azure/functions');
const { z } = require('zod');
const { randomBytes, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const { scrypt } = require('node:crypto');

const { getSqlClient } = require('../lib/db');

const scryptAsync = promisify(scrypt);

const registerSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

const sessionDurationDaysRaw = Number(process.env.SESSION_TOKEN_TTL_DAYS ?? '7');
const sessionDurationDays = Number.isFinite(sessionDurationDaysRaw) && sessionDurationDaysRaw > 0
  ? sessionDurationDaysRaw
  : 7;
const SESSION_DURATION_MS = sessionDurationDays * 24 * 60 * 60 * 1000;

let schemaEnsured = false;

async function ensureUsersTable(sql) {
  if (schemaEnsured) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      session_token TEXT,
      session_expires_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS users_session_token_idx ON users (session_token)
  `;

  schemaEnsured = true;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') {
    return false;
  }

  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const derived = await scryptAsync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, 'hex');
  const comparisonBuffer = Buffer.from(derived);

  if (storedBuffer.length !== comparisonBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, comparisonBuffer);
}

function generateSessionToken() {
  return randomBytes(48).toString('hex');
}

function buildResponse(status, body) {
  return {
    status,
    headers: corsHeaders,
    jsonBody: body,
  };
}

function serializeUser(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.created_at instanceof Date ? record.created_at.toISOString() : record.created_at,
  };
}

async function handleRegister(request, context) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    context.error('Failed to parse register payload.', error);
    return buildResponse(400, { error: { message: 'O corpo da requisição deve ser um JSON válido.' } });
  }

  const parseResult = registerSchema.safeParse(payload);

  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((issue) => issue.message);
    return buildResponse(400, { error: { message: issues.join(' ') } });
  }

  const { name, email, password } = parseResult.data;
  const normalizedName = name.replace(/\s+/g, ' ').trim();

  try {
    const sql = getSqlClient();
    await ensureUsersTable(sql);

    const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`;

    if (existing) {
      return buildResponse(409, { error: { message: 'Já existe um usuário cadastrado com este e-mail.' } });
    }

    const passwordHash = await hashPassword(password);
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const [inserted] = await sql`
      INSERT INTO users (name, email, password_hash, session_token, session_expires_at)
      VALUES (${normalizedName}, ${email}, ${passwordHash}, ${token}, ${expiresAt})
      RETURNING id, name, email, created_at
    `;

    return buildResponse(201, {
      user: serializeUser(inserted),
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    context.error('Failed to register user.', error);
    return buildResponse(500, { error: { message: 'Não foi possível criar o usuário. Tente novamente mais tarde.' } });
  }
}

async function handleLogin(request, context) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    context.error('Failed to parse login payload.', error);
    return buildResponse(400, { error: { message: 'O corpo da requisição deve ser um JSON válido.' } });
  }

  const parseResult = loginSchema.safeParse(payload);

  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((issue) => issue.message);
    return buildResponse(400, { error: { message: issues.join(' ') } });
  }

  const { email, password } = parseResult.data;

  try {
    const sql = getSqlClient();
    await ensureUsersTable(sql);

    const [record] = await sql`
      SELECT id, name, email, password_hash, created_at
      FROM users
      WHERE email = ${email}
    `;

    if (!record) {
      return buildResponse(401, { error: { message: 'Credenciais inválidas.' } });
    }

    const isValid = await verifyPassword(password, record.password_hash);

    if (!isValid) {
      return buildResponse(401, { error: { message: 'Credenciais inválidas.' } });
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await sql`
      UPDATE users
      SET session_token = ${token}, session_expires_at = ${expiresAt}, updated_at = NOW()
      WHERE id = ${record.id}
    `;

    return buildResponse(200, {
      user: serializeUser(record),
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    context.error('Failed to authenticate user.', error);
    return buildResponse(500, { error: { message: 'Não foi possível realizar o login. Tente novamente mais tarde.' } });
  }
}

async function handleMe(request, context) {
  const authorization = request.headers.get('authorization');

  if (!authorization || typeof authorization !== 'string') {
    return buildResponse(401, { error: { message: 'Token de autenticação não fornecido.' } });
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return buildResponse(401, { error: { message: 'Formato de token inválido.' } });
  }

  try {
    const sql = getSqlClient();
    await ensureUsersTable(sql);

    const [record] = await sql`
      SELECT id, name, email, created_at, session_expires_at
      FROM users
      WHERE session_token = ${token}
    `;

    if (!record) {
      return buildResponse(401, { error: { message: 'Sessão não encontrada.' } });
    }

    const now = Date.now();
    const expiresAt = record.session_expires_at instanceof Date
      ? record.session_expires_at.getTime()
      : new Date(record.session_expires_at).getTime();

    if (!expiresAt || expiresAt < now) {
      return buildResponse(401, { error: { message: 'Sessão expirada.' } });
    }

    return buildResponse(200, {
      user: serializeUser(record),
      token,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    context.error('Failed to retrieve user session.', error);
    return buildResponse(500, { error: { message: 'Não foi possível validar a sessão. Tente novamente.' } });
  }
}

app.http('auth', {
  route: 'auth/{action}',
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return {
        status: 204,
        headers: corsHeaders,
      };
    }

    const action = request.params.action;

    if (!action) {
      return buildResponse(404, { error: { message: 'Rota não encontrada.' } });
    }

    if (request.method === 'GET' && action === 'me') {
      return handleMe(request, context);
    }

    if (request.method === 'POST' && action === 'register') {
      return handleRegister(request, context);
    }

    if (request.method === 'POST' && action === 'login') {
      return handleLogin(request, context);
    }

    return buildResponse(404, { error: { message: 'Rota não encontrada.' } });
  },
});
