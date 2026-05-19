const logger = require('../utils/logger');
const Tasks = require('../models/tasks');
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
    return res.json(tasks);
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasksByWeekStart };
