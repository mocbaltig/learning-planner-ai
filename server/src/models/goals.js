const db = require('../utils/db');

class Goals {
  async create({ userId, title, description, deadline }) {
    const result = await db.query(
      'INSERT INTO goals (user_id, title, description, deadline) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, description, deadline],
    );
    return result.rows[0];
  }

  async getAll(userId) {
    const result = await db.query(
      `SELECT g.*,
         COALESCE(COUNT(t.id)::int, 0) AS task_total,
         COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'done')::int, 0) AS task_done_count
       FROM goals g
       LEFT JOIN tasks t ON t.goal_id = g.id
       WHERE g.user_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async findById(id, userId) {
    const result = await db.query(
      `
      SELECT
          g.*,
          COALESCE(
              (
                  SELECT json_agg(
                      json_build_object(
                          'id', t.id,
                          'title', t.title,
                          'description', t.description,
                          'duration_estimate', t.duration_estimate,
                          'planned_date', t.planned_date,
                          'planned_slot', t.planned_slot,
                          'status', t.status,
                          'actual_duration', t.actual_duration,
                          'completed_at', t.completed_at,
                          'rationale', t.rationale,
                          'created_at', t.created_at
                      )
                  )
                  FROM tasks t
                  WHERE t.goal_id = g.id
              ),
              '[]'::json
          ) AS tasks
      FROM goals g WHERE g.id = $1 AND g.user_id = $2`,
      [id, userId],
    );
    return result.rows[0];
  }

  async update({ id, userId, title, description, deadline }) {
    const result = await db.query(
      'UPDATE goals SET title = COALESCE($1, title), description = COALESCE($2, description), deadline = COALESCE($3, deadline) WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, description, deadline, id, userId],
    );
    return result.rows[0];
  }

  async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId],
    );
    return result.rows[0].id;
  }
}

module.exports = new Goals();
