const { Pool } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL;

let pool;

function getPool() {
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not configured.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: 'require',
      min: 0,
      max: 4,
    });
  }

  return pool;
}

async function query(text, params = []) {
  const activePool = getPool();
  return activePool.query(text, params);
}

module.exports = {
  query,
};
