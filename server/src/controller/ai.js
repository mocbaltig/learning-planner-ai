const Goals = require('../models/goals');
const Profiles = require('../models/profiles');
const Tasks = require('../models/tasks');
const AIRecommendations = require('../models/ai_recommendations');
const ProgressSnapshots = require('../models/progress_snapshots');
const AuditLogs = require('../models/audit_logs');
const { NotFoundError, UnprocessableEntityError, ClientError } = require('../exceptions');
const { callLLM, validateAIOutput } = require('../services/llm');
const { aiRescheduleOutputSchema } = require('../validator/ai-schema');
const logger = require('../utils/logger');
const { acceptanceRate } = require('../utils/metrics');
const { computeConfidence } = require('../utils/confidence');
const { getWeekEnd, getCurrentWeekStart, getCurrentWeek } = require('../utils/week');

const createSuggestion = async (req, res, next) => {
  try {
    const { goal_id: goalId, week_start: weekStart } = req.validated;
    const goal = await Goals.findById(goalId, req.user.id);
    if (!goal) {
      return next(new NotFoundError('Goal tidak ditemukan'));
    }

    const profile = await Profiles.findByUserId(req.user.id);
    if (!profile) {
      return next(new NotFoundError('Profile tidak ditemukan'));
    }

    const weekEnd = getWeekEnd(new Date(weekStart));
    const existingTasks = await Tasks.findByWeekStart(req.user.id, weekStart, weekEnd);

    const context = {
      week_start: weekStart, // Gemini HARUS tahu rentang ini
      week_end: weekEnd,
      goal: {
        title: goal.title,
        description: goal.description,
        deadline: goal.deadline,
      },
      weekly_target_hours: profile.weekly_target_hours,
      preferred_time: profile.preferred_time,
      existing_tasks: existingTasks.map((t) => ({
        title: t.title,
        planned_date: t.planned_date,
        planned_slot: t.planned_slot,
      })),
    };

    let finalOutput;
    let tokenCount = 0;
    const { text: raw, tokenCount: firstTokens } = await callLLM(
      'suggest',
      context,
      req.user.id,
    );
    console.log("===== RAW AI OUTPUT =====");
console.log(raw);
console.log("=========================");

finalOutput = validateAIOutput(raw);

if (!finalOutput) {
  // retry 1x
  const { text: retryRaw, tokenCount: retryTokens } = await callLLM(
    'suggest',
    context,
    req.user.id,
  );

  console.log("===== RETRY AI OUTPUT =====");
  console.log(retryRaw);
  console.log("===========================");

  finalOutput = validateAIOutput(retryRaw);
  tokenCount = retryTokens;

  if (!finalOutput) {
    logger.warn({
      request_id: req.requestId,
      action: 'ai_suggest_failed',
    });

    return next(
      new UnprocessableEntityError(
        'AI tidak dapat memberikan saran yang valid. Coba lagi nanti.',
      ),
    );
  }
} else {
  tokenCount = firstTokens;
}

    await AIRecommendations.create({
      user_id: req.user.id,
      type: 'suggest',
      input_context: context,
      output: finalOutput,
      token_count: tokenCount,
    });

    res.json({ ...finalOutput, confidence: computeConfidence(context) });
  } catch (error) {
    next(error);
  }
};

const editLatestRecommendation = async (req, res, next) => {
  try {
    const { status } = req.body;
    const recommendation = await AIRecommendations.findLatestByUserId(req.user.id);
    if (!recommendation) {
      return next(new NotFoundError('AI recommendations tidak ditemukan'));
    }
    await AIRecommendations.updateStatus(recommendation.id, status);
    await AuditLogs.create({
      user_id: req.user.id,
      action: `recommendation_${status}`,
      recommendation_id: recommendation.id,
      metadata: { status },
    });
    acceptanceRate.set(await AIRecommendations.getAcceptanceRate());
    res.json({ id: recommendation.id, status });
  } catch (error) {
    next(error);
  }
};

const editRecommendationById = async (req, res, next) => {
  try {
    const rec = await AIRecommendations.findById(req.params.id);
    if (!rec) {
      return next(new NotFoundError('AI recommendations tidak ditemukan'));
    }
    await AIRecommendations.updateStatus(rec.id, req.body.status);
    await AuditLogs.create({
      user_id: req.user.id,
      action: `recommendation_${req.body.status}`,
      recommendation_id: req.params.id,
      metadata: { status: req.body.status },
    });
    acceptanceRate.set(await AIRecommendations.getAcceptanceRate());
    return res.json({ id: rec.id });
  } catch (error) {
    next(error);
  }
};

const reschedule = async (req, res, next) => {
  try {
    const { task_ids } = req.validated;

    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      return next(new ClientError('task_ids harus berupa array UUID yang tidak kosong'));
    }

    const overdueTasks = await Tasks.findOverdueTasksByIds(req.user.id, task_ids);
    console.log("OVERDUE TASKS:", overdueTasks);
    console.log("TASK IDS:", task_ids);
    const weekStart = getCurrentWeekStart();
    const weekTasks = await Tasks.findTasksByWeek(req.user.id, weekStart);
    const todoWeekTasks = weekTasks.filter((t) => t.status === 'todo');

    // Ambil profile untuk availability
    const profile = await Profiles.getProfile(req.user.id);

    // Ambil progress minggu ini
    const week = getCurrentWeek();
    await ProgressSnapshots.recalculateProgress(req.user.id, weekStart);
    const progress = await ProgressSnapshots.getProgress(req.user.id, week);

    const baseContext = {
      overdue_tasks: overdueTasks.map((t) => ({
        id: t.id,
        title: t.title,
        duration_estimate: t.duration_estimate,
        original_date: t.planned_date,
      })),
      current_week_tasks: todoWeekTasks.map((t) => ({
        planned_date: t.planned_date,
        planned_slot: t.planned_slot,
        duration_estimate: t.duration_estimate,
      })),
      availability: profile?.availability || {},
      remaining_capacity:
        (profile?.weekly_target_hours || 5) - (progress?.completed_hours || 0),
    };

    function findConflicts(proposed, existing) {
      const dateStr = (d) => (d instanceof Date ? d.toISOString().split('T')[0] : d);
      const existingKeys = new Set(
        existing.map((t) => `${dateStr(t.planned_date)}|${t.planned_slot}`),
      );
      const proposedKeys = new Set();
      const conflicts = [];
      for (const t of proposed) {
        const key = `${t.planned_date}|${t.planned_slot}`;
        if (existingKeys.has(key) || proposedKeys.has(key)) {
          conflicts.push({ date: t.planned_date, slot: t.planned_slot, title: t.title });
        }
        proposedKeys.add(key);
      }
      return conflicts;
    }

    const MAX_RETRIES = 2;
    let validated = null;
    let usedContext = baseContext;
    let tokenCount = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const { text: raw, tokenCount: attemptTokens } = await callLLM(
        'reschedule',
        usedContext,
        req.user.id,
      );

      console.log(`===== RAW RESCHEDULE OUTPUT (Attempt ${attempt + 1}) =====`);
      console.log(raw);
      console.log("================================================");

      validated = validateAIOutput(raw, aiRescheduleOutputSchema);
      if (!validated) continue;

      const conflicts = findConflicts(validated.tasks, todoWeekTasks);
      if (!conflicts.length) {
        tokenCount = attemptTokens;
        break;
      }

      if (attempt < MAX_RETRIES) {
        const dateStr = (d) => (d instanceof Date ? d.toISOString().split('T')[0] : d);
        const occupiedSlots = [
          ...new Set(
            todoWeekTasks.map((t) => `${dateStr(t.planned_date)} ${t.planned_slot}`),
          ),
        ];
        usedContext = {
          ...baseContext,
          occupied_slots: occupiedSlots,
          conflict_warning: `HINDARI slot yang sudah terisi: ${occupiedSlots.join(', ')}. Jangan jadwalkan task di slot tersebut.`,
        };
      }

      validated = null;
    }

    if (!validated) {
      return next(
        new UnprocessableEntityError(
          'AI tidak dapat menjadwalkan ulang saat ini. Coba lagi.',
        ),
      );
    }

    // Simpan rekomendasi untuk audit
    const recId = await AIRecommendations.create({
      user_id: req.user.id,
      type: 'reschedule',
      input_context: JSON.stringify(usedContext),
      output: JSON.stringify(validated),
      token_count: tokenCount,
    });

    await AuditLogs.create({
      user_id: req.user.id,
      action: 'reschedule_generated',
      recommendation_id: recId,
      metadata: { task_ids, week_start: weekStart },
    });
    acceptanceRate.set(await AIRecommendations.getAcceptanceRate());

    res.json({
      ...validated,
      confidence: computeConfidence({
        week_start: weekStart,
        weekly_target_hours: profile?.weekly_target_hours || 5,
        preferred_time: profile?.preferred_time,
        existing_tasks: todoWeekTasks,
      }),
    });
  } catch (err) {
    next(err);
  }
};

const getTokenUsage = async (req, res, next) => {
  try {
    const usage = await AIRecommendations.getTokenUsage(req.user.id, 100);
    res.json(usage);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSuggestion,
  editLatestRecommendation,
  editRecommendationById,
  reschedule,
  getTokenUsage,
};
