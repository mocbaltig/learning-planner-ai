const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { clientSuggestPayloadSchema } = require('../validator/ai-schema');
const {
  createSuggestion,
  editLatestRecommendation,
  editRecommendationById,
} = require('../controller/ai');

router.post(
  '/plan/suggest',
  authenticate,
  validate(clientSuggestPayloadSchema),
  createSuggestion,
);

// NOTE: buat route ini karena pada `/api/ai/plan/suggest` id ai_recommendations ga dikirim ke client
router.patch('/recommendations/latest', authenticate, editLatestRecommendation);
router.patch('/recommendations/:id', authenticate, editRecommendationById);

module.exports = router;
