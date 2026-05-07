// TODO: Implementasikan AI assistant endpoints.
// Lihat modul Scaffolding (stub) dan Cycle 1 (implementasi penuh).
// POST /plan/suggest
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { callLLM, validateAIOutput } = require('../services/llm');
const { z } = require('zod');
const { Goals } = require('../models/goals');
const { Profiles } = require('../models/profiles');
const { Tasks } = require('../models/tasks');
const logger = require('../utils/logger');
const { AIRecommendations } = require('../models/ai_recommendations');
const { NotFoundError, UnprocessableEntityError } = require('../exceptions');

const SuggestInput = z.object({
  goal_id: z.string().uuid(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.post('/plan/suggest', authenticate, async (req, res, next) => {
  const input = SuggestInput.safeParse(req.body);
  if (!input.success) {
    return next(input.error);
  }

  const goal = await Goals.findById(input.data.goal_id);
  if (!goal) {
    return next(new NotFoundError('Goal tidak ditemukan'));
  }

  const profile = await Profiles.findByUserId(req.user.id);
  if (!profile) {
    return next(new NotFoundError('Profile tidak ditemukan'));
  }

  const existingTasks = await Tasks.findByWeek(req.user.id, input.week_start);

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
});

// NOTE: buat route ini karena pada `/api/ai/plan/suggest`
// id ai_recommendations ga dikirim ke client
router.patch(
  '/recommendations/latest',
  authenticate,
  async (req, res, next) => {
    const { status } = req.body;
    const recommendation = await AIRecommendations.findLatestByUserId(
      req.user.id,
    );
    if (!recommendation) {
      return next(new NotFoundError('AI recommendations tidak ditemukan'));
    }
    await AIRecommendations.updateStatus(recommendation.id, status);
    res.json({ id: recommendation.id, status });
  },
);

router.patch('/recommendations/:id', authenticate, async (req, res, next) => {
  const result = await AIRecommendations.updateStatus(
    req.params.id,
    req.body.status,
  );
  if (!result) {
    return next(new NotFoundError('AI recommendations tidak ditemukan'));
  }
  return res.json({ id: result });
});

module.exports = router;
