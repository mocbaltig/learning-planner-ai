const db = require('../utils/db');
const Tasks = require('../models/tasks');
const ProgressSnapshots = require('../models/progress_snapshots.js');
const { getWeekString, getWeekEnd } = require('../utils/week');
const { ClientError } = require('../exceptions');

const exportWeekly = async (req, res, next) => {
  try {
    const { week_start: weekStart } = req.query;

    if (!weekStart) {
      return next(new ClientError('Parameter week_start diperlukan'));
    }

    const weekEnd = getWeekEnd(new Date(weekStart));

    // Ambil tasks
    const tasks = await Tasks.findByWeekStart(req.user.id, weekStart, weekEnd);

    // Ambil progress snapshot
    const week = getWeekString(weekStart);
    const progress = await ProgressSnapshots.getProgress(req.user.id, week);

    return res.json({
      week: weekStart,
      summary: {
        planned_hours: progress?.planned_hours || 0,
        completed_hours: progress?.completed_hours || 0,
        completion_rate: progress?.completion_rate || 0,
      },
      tasks,
      exported_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { exportWeekly };
