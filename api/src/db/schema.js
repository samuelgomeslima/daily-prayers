const { execute } = require('./neon-client');

let initialized = false;
let initializingPromise = null;

const TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    email_confirmation_token TEXT,
    email_confirmation_sent_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)` ,
  `CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS prayers (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_prayers_user_id ON prayers (user_id)`,
  `CREATE TABLE IF NOT EXISTS rosaries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    mysteries JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rosaries_user_id ON rosaries (user_id)`,
  `CREATE TABLE IF NOT EXISTS life_plans (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_life_plans_user_id ON life_plans (user_id)`,
  `CREATE TABLE IF NOT EXISTS life_plan_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    life_plan_id UUID NOT NULL REFERENCES life_plans(id) ON DELETE CASCADE,
    step_identifier TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_life_plan_progress_user_id ON life_plan_progress (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_life_plan_progress_plan ON life_plan_progress (life_plan_id)`,
  `CREATE TABLE IF NOT EXISTS user_notes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes (user_id)`,
  `CREATE TABLE IF NOT EXISTS ai_model_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_model TEXT NOT NULL,
    catechist_model TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS rosary_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rosary_id UUID REFERENCES rosaries(id) ON DELETE SET NULL,
    current_mystery TEXT,
    decades_completed SMALLINT NOT NULL DEFAULT 0,
    total_decades SMALLINT NOT NULL DEFAULT 5,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    prayed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rosary_progress_user_id ON rosary_progress (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_rosary_progress_rosary_id ON rosary_progress (rosary_id)`
];

async function ensureSchema() {
  if (initialized) {
    return;
  }

  if (initializingPromise) {
    await initializingPromise;
    return;
  }

  initializingPromise = (async () => {
    for (const statement of TABLE_STATEMENTS) {
      await execute(statement);
    }
  })();

  try {
    await initializingPromise;
    initialized = true;
  } catch (error) {
    initialized = false;
    initializingPromise = null;
    throw error;
  }
}

module.exports = {
  ensureSchema,
};
