const Goals = require('../models/goals');
const Profiles = require('../models/profiles');
const Tasks = require('../models/tasks');
const AIRecommendations = require('../models/ai_recommendations');
const ProgressSnapshots = require('../models/progress_snapshots');
const { NotFoundError, UnprocessableEntityError, ClientError } = require('../exceptions');
const { callLLM, validateAIOutput } = require('../services/llm');
const logger = require('../utils/logger');
const { getCurrentWeekStart, getCurrentWeek } = require('../utils/week');

const createSuggestion = async (req, res, next) => {
  try {
    const data = req.validated;
    const goal = await Goals.findById(data.goal_id);
    if (!goal) {
      return next(new NotFoundError('Goal tidak ditemukan'));
    }

    const profile = await Profiles.findByUserId(req.user.id);
    if (!profile) {
      return next(new NotFoundError('Profile tidak ditemukan'));
    }

    const existingTasks = await Tasks.findByWeekStart(req.user.id, data.week_start);

    const context = {
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
    const raw = await callLLM('suggest', context);
    finalOutput = validateAIOutput(raw);
    if (!finalOutput) {
      // retry 1x
      const retry = await callLLM('suggest', context);
      finalOutput = validateAIOutput(retry);
      if (!finalOutput) {
        logger.warn({ request_id: req.requestId, action: 'ai_suggest_failed' });
        return next(
          new UnprocessableEntityError(
            'AI tidak dapat memberikan saran yang valid. Coba lagi nanti.',
          ),
        );
      }
    }

    await AIRecommendations.create({
      user_id: req.user.id,
      type: 'suggest',
      input_context: context,
      output: finalOutput,
    });

    res.json(finalOutput);
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
    res.json({ id: recommendation.id, status });
  } catch (error) {
    next(error);
  }
};

const editRecommendationById = async (req, res, next) => {
  try {
    const result = await AIRecommendations.updateStatus(req.params.id, req.body.status);
    if (!result) {
      return next(new NotFoundError('AI recommendations tidak ditemukan'));
    }
    return res.json({ id: result });
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

    const overdueTasks = await Tasks.findTasksByIds(task_ids);
    const weekStart = getCurrentWeekStart();
    const weekTasks = await Tasks.findTasksByWeek(req.user.id, weekStart);

    // Ambil profile untuk availability
    const profile = await Profiles.getProfile(req.user.id);

    // Ambil progress minggu ini
    const week = getCurrentWeek();
    const progress = await ProgressSnapshots.getProgress(req.user.id, week);

    const context = {
      overdue_tasks: overdueTasks.map((t) => ({
        id: t.id,
        title: t.title,
        duration_estimate: t.duration_estimate,
        original_date: t.planned_date,
      })),
      current_week_tasks: weekTasks
        .filter((t) => t.status === 'todo')
        .map((t) => ({
          planned_date: t.planned_date,
          planned_slot: t.planned_slot,
          duration_estimate: t.duration_estimate,
        })),
      availability: profile?.availability || {},
      remaining_capacity:
        (profile?.weekly_target_hours || 5) - (progress?.completed_hours || 0),
    };

    const raw = await callLLM('reschedule', context);
    const validated = validateAIOutput(raw);

    if (!validated) {
      return next(
        new UnprocessableEntityError(
          'AI tidak dapat menjadwalkan ulang saat ini. Coba lagi.',
        ),
      );
    }

    // Simpan rekomendasi untuk audit
    await AIRecommendations.create({
      user_id: req.user.id,
      type: 'reschedule',
      input_context: JSON.stringify(context),
      output: JSON.stringify(validated),
    });

    res.json(validated);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSuggestion,
  editLatestRecommendation,
  editRecommendationById,
  reschedule,
};
