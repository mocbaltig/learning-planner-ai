const { ClientError } = require('../exceptions');
const ProgressSnapshots = require('../models/progress_snapshots');

const getWeeklyProgress = async (req, res, next) => {
  try {
    const { week } = req.query; // format: 2026-W15
    if (!week) {
      return next(new ClientError('Parameter week diperlukan (format: YYYY-Wxx)'));
    }

    const progress = await ProgressSnapshots.getProgress(req.user.id, week);
    if (!progress) {
      return res.json({ week, planned_hours: 0, completed_hours: 0, completion_rate: 0 });
    }

    res.json(progress);
  } catch (err) {
    next(err);
  }
};

const getTrendProgress = async (req, res, next) => {
  try {
    const history = await ProgressSnapshots.findAllByUserId(req.user.id);
    res.json(history.map((h) => ({
      week: h.week,
      planned: parseFloat(h.planned_hours),
      completed: parseFloat(h.completed_hours),
      rate: parseFloat(h.completion_rate),
    })));
  } catch (err) {
    next(err);
  }
};

module.exports = { getWeeklyProgress, getTrendProgress };
