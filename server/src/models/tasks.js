const db = require('../utils/db');

class Tasks {
  async create({
    goal_id,
    title,
    description,
    duration_estimate,
    planned_date,
    planned_slot,
    status,
    source,
    rationale,
  }) {
    const result = await db.query(
      `INSERT INTO tasks
        (goal_id,
        title,
        description,
        duration_estimate,
        planned_date,
        planned_slot,
        status,
        source,
        rationale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
      [
        goal_id,
        title,
        description,
        duration_estimate,
        planned_date,
        planned_slot,
        status,
        source,
        rationale,
      ],
    );
    return result.rows[0];
  }

  async findByWeek(userId, weekStart) {
    const result = await db.query(
      `SELECT t.title, t.planned_date, t.planned_slot
        FROM tasks t
        LEFT JOIN goals g ON g.id = t.goal_id
        WHERE g.user_id = $1
          AND t.planned_date >= $2
          AND t.planned_date < $2 + INTERVAL '7 days'`,
      [userId, weekStart],
    );
    return result.rows;
  }
}

module.exports = { Tasks: new Tasks() };
