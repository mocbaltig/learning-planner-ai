const Goals = require('../models/goals');
const Profiles = require('../models/profiles');
const Tasks = require('../models/tasks');
const AIRecommendations = require('../models/ai_recommendations');
const { NotFoundError, UnprocessableEntityError } = require('../exceptions');
const { callLLM, validateAIOutput } = require('../services/llm');
const logger = require('../utils/logger');

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

module.exports = {
  createSuggestion,
  editLatestRecommendation,
  editRecommendationById,
};
