const db = require('../utils/db');

class AIRecommendations {
  async create({ user_id, type, input_context, output, token_count = 0 }) {
    const result = await db.query(
      'INSERT INTO ai_recommendations (user_id, type, input_context, output, token_count) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user_id, type, input_context, output, token_count],
    );
    return result.rows[0].id;
  }
  async findLatestByUserId(userId) {
    const result = await db.query(
      'SELECT id, status, type FROM ai_recommendations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId],
    );
    return result.rows[0] || null;
  }

  async findById(id) {
    const result = await db.query(
      'SELECT id, status, type FROM ai_recommendations WHERE id = $1',
      [id],
    );
    return result.rows[0] || null;
  }

  async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE ai_recommendations SET status = $1 WHERE id = $2 RETURNING id',
      [status, id],
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].id;
  }

  async getTotalTokenUsage() {
    const result = await db.query(
      'SELECT COALESCE(SUM(token_count), 0)::int AS total FROM ai_recommendations',
    );
    return result.rows[0].total;
  }

  async getAcceptanceRate() {
    const result = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'accepted')::float /
        NULLIF(COUNT(*) FILTER (WHERE status IS NOT NULL), 0) AS rate
      FROM ai_recommendations`,
    );
    return result.rows[0].rate || 0;
  }

  async getTokenUsage(userId, batchSize = 100) {
    const result = await db.query(
      `SELECT
        batch,
        COUNT(*)::int AS recommendation_count,
        SUM(token_count)::int AS total_tokens
      FROM (
        SELECT
          token_count,
          CEIL(ROW_NUMBER() OVER (ORDER BY created_at DESC) / $2::numeric) AS batch
        FROM ai_recommendations
        WHERE user_id = $1
      ) sub
      GROUP BY batch
      ORDER BY batch`,
      [userId, batchSize],
    );
    return result.rows;
  }
}

module.exports = new AIRecommendations();
