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
      `SELECT u.id, u.email, u.created_at, p.timezone, p.preferred_time, p.weekly_target_hours, p.availability
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.id = $1`,
      [userId],
    );
    return result.rows[0];
  }

  async updateByUserId(
    userId,
    { timezone, preferredTime, weeklyTargetHours, availability },
  ) {
    const result = await db.query(
      `UPDATE profiles SET
        timezone = COALESCE($1, timezone),
        preferred_time = COALESCE($2, preferred_time),
        weekly_target_hours = COALESCE($3, weekly_target_hours )
        availability = COALESCE($4, availability )
        WHERE user_id = $5 RETURNING *`,
      [timezone, preferredTime, weeklyTargetHours, availability, userId],
    );
    return result.rows[0];
  }
}

module.exports = { Profiles: new Profiles() };
