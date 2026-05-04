const db = require('../utils/db');

class AIRecommendations {
  async create({ user_id, type, input_context, output }) {
    const result = await db.query(
      'INSERT INTO ai_recommendations (user_id, type, input_context, output) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_id, type, input_context, output],
    );
    return result.rows[0].id;
  }
  async findLatestByUserId(userId) {
    const result = await db.query(
      'SELECT id, status FROM ai_recommendations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId],
    );
    return result.rows[0] || null;
  }

  async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE ai_recommendations SET status = $1 WHERE id = $2 RETURNING id',
      [status, id],
    );
    return result.rows[0].id;
  }
}

module.exports = { AIRecommendations: new AIRecommendations() };
