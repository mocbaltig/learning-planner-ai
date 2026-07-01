const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { clientSuggestPayloadSchema, reschedulePayloadSchema } = require('../validator/ai-schema');
const {
  createSuggestion,
  createSuggestionStream,
  editRecommendationById,
  reschedule,
  rescheduleStream,
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

router.post(
  '/plan/suggest/stream',
  authenticate,
  validate(clientSuggestPayloadSchema),
  createSuggestionStream,
);

router.post(
  '/plan/reschedule/stream',
  authenticate,
  validate(reschedulePayloadSchema),
  rescheduleStream,
);

router.patch('/recommendations/:id', authenticate, editRecommendationById);

router.get('/token-usage', authenticate, getTokenUsage);

module.exports = router;
