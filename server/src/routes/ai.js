const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { clientSuggestPayloadSchema, reschedulePayloadSchema } = require('../validator/ai-schema');
const {
  createSuggestion,
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

router.patch('/recommendations/:id', authenticate, editRecommendationById);

router.get('/token-usage', authenticate, getTokenUsage);

module.exports = router;
