const postgres = require('postgres');

let client = null;

function getSqlClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || typeof connectionString !== 'string') {
    throw new Error('DATABASE_URL environment variable is not configured.');
  }

  if (!client) {
    client = postgres(connectionString, {
      ssl: 'require',
      connection: {
        application_name: 'daily-prayers-api',
      },
      max: 3,
    });
  }

  return client;
}

module.exports = {
  getSqlClient,
};
