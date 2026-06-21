const db = require('../utils/db');

class Profiles {
  async init(userId) {
    const result = await db.query(
      'INSERT INTO profiles (user_id) VALUES ($1) RETURNING id',
      [userId],
    );
    return result.rows[0].id;
  }

  async findByUserId(userId) {
    const result = await db.query(
      `SELECT u.id, u.email, u.created_at, u.is_admin, p.timezone, p.preferred_time, p.weekly_target_hours, p.availability, p.llm_token_count
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.id = $1`,
      [userId],
    );
    return result.rows[0];
  }

  async updateByUserId(
    userId,
    { timezone, preferred_time, weekly_target_hours, availability },
  ) {
    const result = await db.query(
      `UPDATE profiles SET
        timezone = COALESCE($1, timezone),
        preferred_time = COALESCE($2, preferred_time),
        weekly_target_hours = COALESCE($3, weekly_target_hours),
        availability = COALESCE($4, availability)
        WHERE user_id = $5 RETURNING *`,
      [timezone, preferred_time, weekly_target_hours, availability, userId],
    );
    return result.rows[0];
  }

  async incrementTokenCount(userId, tokens) {
    await db.query(
      'UPDATE profiles SET llm_token_count = COALESCE(llm_token_count, 0) + $1 WHERE user_id = $2',
      [tokens, userId],
    );
  }

  async getProfile(userId) {
    const result = await db.query(
      'SELECT availability, weekly_target_hours FROM profiles WHERE user_id = $1',
      [userId],
    );
    return result.rows[0];
  }
}

module.exports = new Profiles();
