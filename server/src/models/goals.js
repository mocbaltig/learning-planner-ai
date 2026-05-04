const db = require('../utils/db');
const { z } = require('zod');

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
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return result.rows;
  }

  async findById(id) {
    const result = await db.query('SELECT * FROM goals WHERE id = $1', [id]);
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

const GoalInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

module.exports = { Goals: new Goals(), GoalInput };
