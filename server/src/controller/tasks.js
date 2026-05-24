const logger = require('../utils/logger');
const Tasks = require('../models/tasks');
const ProgressSnapshots = require('../models/progress_snapshots');
const { InvariantError, NotFoundError, ClientError } = require('../exceptions');
const { getWeekend } = require('../utils/week');

const createTask = async (req, res, next) => {
  try {
    const data = req.validated;
    const task = await Tasks.create({ ...data, status: 'todo' });

    if (!task) {
      return next(new InvariantError('Gagal membuat task'));
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
    const { week_start: weekStart } = req.query; // format 2026-04-06
    if (!weekStart) {
      return next(
        new ClientError('Parameter week_start diperlukan (format: YYYY-MM-DD)'),
      );
    }
    const weekEnd = getWeekend(new Date(weekStart));
    const tasks = await Tasks.findByWeekStart(req.user.id, weekStart, weekEnd);
    const grouped = {};
    for (const task of tasks) {
      const day = task.planned_date.toISOString().split('T')[0];
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

const editStatus = async (req, res, next) => {
  try {
    const { status, actual_duration } = req.body;

    // Ambil task dan verifikasi ownership
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

module.exports = {
  createTask,
  getTasksByWeekStart,
  editStatus,
};
