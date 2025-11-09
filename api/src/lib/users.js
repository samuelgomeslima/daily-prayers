const { query } = require('./db');

async function findUserByEmail(email) {
  const result = await query(
    `select id, email, name, password_hash as "passwordHash", created_at as "createdAt"
     from users
     where email = $1`,
    [email]
  );

  return result.rows[0] ?? null;
}

async function findUserById(id) {
  const result = await query(
    `select id, email, name, created_at as "createdAt"
     from users
     where id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

async function createUser({ id, email, name, passwordHash }) {
  const result = await query(
    `insert into users (id, email, name, password_hash)
     values ($1, $2, $3, $4)
     returning id, email, name, created_at as "createdAt"`,
    [id, email, name, passwordHash]
  );

  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
