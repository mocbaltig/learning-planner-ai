const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { clientSuggestPayloadSchema, reschedulePayloadSchema } = require('../validator/ai-schema');
const {
  createSuggestion,
  editLatestRecommendation,
  editRecommendationById,
  reschedule,
  getTokenUsage,
} = require('../controller/ai');

router.post(
  '/plan/suggest',
  authenticate,
  validate(clientSuggestPayloadSchema),
  createSuggestion,
);

router.post(
  '/plan/reschedule',
  authenticate,
  validate(reschedulePayloadSchema),
  reschedule,
);

// NOTE: buat route ini karena pada `/api/ai/plan/suggest` id ai_recommendations ga dikirim ke client
router.patch('/recommendations/latest', authenticate, editLatestRecommendation);
router.patch('/recommendations/:id', authenticate, editRecommendationById);

router.get('/token-usage', authenticate, getTokenUsage);

module.exports = router;
