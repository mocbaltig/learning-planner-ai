const db = require('../utils/db');
const Tasks = require('../models/tasks');
const ProgressSnapshots = require('../models/progress_snapshots.js');
const { getWeekString, getWeekEnd } = require('../utils/week');
const { ClientError } = require('../exceptions');

const SLOT_TIME = { morning: '080000', afternoon: '130000', evening: '180000' };

function foldLine(str) {
  const max = 75;
  if (str.length <= max) return str;
  const parts = [str.substring(0, max)];
  for (let i = max; i < str.length; i += max - 1) {
    parts.push(' ' + str.substring(i, i + max - 1));
  }
  return parts.join('\r\n');
}

function escapeICS(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

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

const exportWeeklyICS = async (req, res, next) => {
  try {
    const { week_start: weekStart } = req.query;

    if (!weekStart) {
      return next(new ClientError('Parameter week_start diperlukan'));
    }

    const weekEnd = getWeekEnd(new Date(weekStart));
    const tasks = await Tasks.findByWeekStart(req.user.id, weekStart, weekEnd);

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI Planner//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const task of tasks) {
      const d = new Date(task.planned_date);
      const dateKey = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('');
      const startTime = SLOT_TIME[task.planned_slot] || '080000';
      const dur = task.duration_estimate || 120;
      const startMin =
        parseInt(startTime.substring(0, 2), 10) * 60 +
        parseInt(startTime.substring(2, 4), 10);
      const endMin = startMin + dur;
      const endTime =
        String(Math.floor(endMin / 60)).padStart(2, '0') +
        String(endMin % 60).padStart(2, '0') +
        '00';

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${task.id}@ai-planner`);
      lines.push(`DTSTART:${dateKey}T${startTime}`);
      lines.push(`DTEND:${dateKey}T${endTime}`);
      lines.push(`SUMMARY:${escapeICS(task.title)}`);
      if (task.description) lines.push(`DESCRIPTION:${escapeICS(task.description)}`);
      lines.push(`DTSTAMP:${now}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="jadwal-${weekStart}.ics"`,
    );
    res.send(lines.map(foldLine).join('\r\n'));
  } catch (err) {
    next(err);
  }
};

module.exports = { exportWeekly, exportWeeklyICS };
