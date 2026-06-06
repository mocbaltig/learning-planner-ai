const db = require('../utils/db');

class AuditLogs {
  async create({ user_id, action, recommendation_id, metadata }) {
    const result = await db.query(
      `INSERT INTO audit_logs (user_id, action, recommendation_id, metadata)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user_id, action, recommendation_id, metadata],
    );
    return result.rows[0].id;
  }

  async findByUserId(userId, limit = 50) {
    const result = await db.query(
      'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
    return result.rows;
  }

  async findByAction(action, limit = 50) {
    const result = await db.query(
      'SELECT * FROM audit_logs WHERE action = $1 ORDER BY created_at DESC LIMIT $2',
      [action, limit],
    );
    return result.rows;
  }
}

module.exports = new AuditLogs();
