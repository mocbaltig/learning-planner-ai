const db = require('../utils/db');
const bcrypt = require('bcryptjs');

class Users {
  async create({ email, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, passwordHash],
    );
    return result.rows[0];
  }

  async emailExist(email) {
    const result = await db.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);
    return result.rows.length > 0;
  }

  async verify(email, password) {
    const user = await db.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email],
    );
    if (!user) {
      return null;
    }
    const { id, password_hash: passwordHash } = user.rows[0];
    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      return null;
    }
    return id;
  }

  async update(id, { email, passwordHash }) {
    const result = await db.query(
      'UPDATE users SET email = COALESCE($1, email), password_hash = COALESCE($2, password_hash) WHERE id = $3 RETURNING id,email',
      [email, passwordHash, id],
    );
    return result.rows[0];
  }

  async delete(id) {
    const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rows[0].id;
  }
}

module.exports = { Users: new Users() };
