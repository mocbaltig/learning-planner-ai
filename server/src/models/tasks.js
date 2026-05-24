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

  async findByWeekStart(userId, weekStart, weekEnd) {
    const result = await db.query(
      `SELECT * FROM tasks
        WHERE goal_id IN (SELECT id FROM goals WHERE user_id = $1)
        AND planned_date BETWEEN $2 AND $3
        ORDER BY planned_date, planned_slot`,
      [userId, weekStart, weekEnd],
    );
    return result.rows;
  }

  async findByGoalId(goalId) {
    const result = await db.query(
      'SELECT * FROM tasks WHERE goal_id = $1 ORDER BY planned_date ASC',
      [goalId],
    );
    return result.rows;
  }

  async findOverdueTasks(userId) {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query(
      `SELECT * FROM tasks
     WHERE goal_id IN (SELECT id FROM goals WHERE user_id = $1)
     AND planned_date < $2
     AND status = 'todo'
     ORDER BY planned_date ASC`,
      [userId, today],
    );
    return result.rows;
  }

  async findTasksByWeek(userId, weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const result = await db.query(
      `SELECT * FROM tasks
      WHERE goal_id IN (SELECT id FROM goals WHERE user_id = $1)
      AND planned_date BETWEEN $2 AND $3
      ORDER BY planned_date, planned_slot`,
      [userId, weekStart, weekEnd.toISOString().split('T')[0]],
    );
    return result.rows;
  }

  async findTasksByIds(taskIds) {
    if (!taskIds.length) return [];
    const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await db.query(
      `SELECT * FROM tasks WHERE id IN (${placeholders})`,
      taskIds,
    );
    return result.rows;
  }

  async findTaskByIdAndUserId(taskId, userId) {
    const result = await db.query(
      `SELECT t.* FROM tasks t
       JOIN goals g ON t.goal_id = g.id
       WHERE t.id = $1 AND g.user_id = $2`,
      [taskId, userId],
    );
    return result.rows[0];
  }

  async updateStatus({ id, status, actual_duration, duration_estimate }) {
    let updateQuery, updateParams;
    if (status === 'done') {
      updateQuery =
        'UPDATE tasks SET status = $1, completed_at = NOW(), actual_duration = $2 WHERE id = $3 RETURNING *';
      updateParams = [status, actual_duration || duration_estimate, id];
    } else {
      updateQuery = 'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *';
      updateParams = [status, id];
    }
    const result = await db.query(updateQuery, updateParams);
    return result.rows[0];
  }
}

module.exports = new Tasks();
