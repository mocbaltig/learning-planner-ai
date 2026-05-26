const logger = require('../utils/logger');
const Tasks = require('../models/tasks');
const ProgressSnapshots = require('../models/progress_snapshots');
const { InvariantError, NotFoundError, ClientError } = require('../exceptions');
const { getWeekEnd } = require('../utils/week');

const createTask = async (req, res, next) => {
  try {
    const data = req.validated;
    const task = await Tasks.create({ ...data, status: 'todo' });

    if (!task) {
      return next(new InvariantError('Gagal membuat task'));
    }

    if (task.planned_date) {
      await ProgressSnapshots.recalculateProgress(req.user.id, task.planned_date);
    }

    logger.info({
      request_id: req.requestId,
      action: 'task_created',
      source: data.source,
      task_id: task.id,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const getTasksByWeekStart = async (req, res, next) => {
  try {
    const { week_start: weekStart, goal_id: goalId } = req.query;

    // Mode 1: filter per goal (dipakai GoalDetail)
    if (goalId && !weekStart) {
      const tasks = await Tasks.findByGoalId(goalId, req.user.id);
      return res.json(tasks);
    }

    // Mode 2: filter per minggu (dipakai Dashboard & Progress)
    if (!weekStart) {
      return next(
        new ClientError('Parameter week_start diperlukan (format: YYYY-MM-DD)'),
      );
    }

    const weekEnd = getWeekEnd(new Date(weekStart));
    const tasks = await Tasks.findByWeekStart(req.user.id, weekStart, weekEnd);

    // Mode 3: filter per minggu + per goal (dipakai GoalDetail dengan week_start)
    if (goalId) {
      const goalTasks = await Tasks.findByGoalAndWeek(goalId, req.user.id, weekStart, weekEnd);
      return res.json(goalTasks);
    }

    // Kalau tidak ada goalId: kembalikan grouped by day (format Calendar/Dashboard)
    const grouped = {};
    for (const task of tasks) {
      const day = task.planned_date instanceof Date
        ? task.planned_date.toISOString().split('T')[0]
        : String(task.planned_date).split('T')[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(task);
    }
    return res.json({ week_start: weekStart, tasks: grouped });
  } catch (error) {
    next(error);
  }
};

const VALID_TRANSITIONS = {
  todo: ['in_progress', 'done', 'skipped'],
  in_progress: ['done', 'skipped'],
  done: [],
  skipped: [],
};

/** Update status dengan validasi transisi ketat (dari main) */
const editStatus = async (req, res, next) => {
  try {
    const { status, actual_duration } = req.body;

    const task = await Tasks.findTaskByIdAndUserId(req.params.id, req.user.id);
    if (!task) {
      return next(new NotFoundError('Task tidak ditemukan'));
    }

    if (!VALID_TRANSITIONS[task.status]?.includes(status)) {
      return next(
        new ClientError(
          `Transisi dari '${task.status}' ke '${status}' tidak diperbolehkan.`,
        ),
      );
    }

    const updated = await Tasks.updateStatus({
      id: req.params.id,
      status,
      actual_duration,
      duration_estimate: task.duration_estimate,
    });

    // Recalculate progress snapshot
    if (task.planned_date) {
      await ProgressSnapshots.recalculateProgress(req.user.id, task.planned_date);
    }

    logger.info({
      request_id: req.requestId,
      action: 'task_status_changed',
      task_id: task.id,
      from: task.status,
      to: status,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const editTask = async (req, res, next) => {
  try {
    const task = await Tasks.findTaskByIdAndUserId(req.params.id, req.user.id);
    if (!task) {
      return next(new NotFoundError('Task tidak ditemukan'));
    }

    const updated = await Tasks.updateTask(req.params.id, req.body);
    if (!updated) {
      return next(new InvariantError('Gagal mengupdate task'));
    }

    if (task.planned_date) {
      await ProgressSnapshots.recalculateProgress(req.user.id, task.planned_date);
    }
    if (req.body.planned_date && req.body.planned_date !== task.planned_date) {
      await ProgressSnapshots.recalculateProgress(req.user.id, req.body.planned_date);
    }

    logger.info({
      request_id: req.requestId,
      action: 'task_updated',
      task_id: req.params.id,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  getTasksByWeekStart,
  editStatus,
  editTask,
};
