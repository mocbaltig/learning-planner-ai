const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate.js');
const { goalPayloadSchema } = require('../validator/goal-schema.js');
const {
  createGoal,
  getAllGoals,
  getGoalById,
  editGoalById,
  deleteGoalById,
} = require('../controller/goals.js');

router.post('/', authenticate, validate(goalPayloadSchema), createGoal);
router.get('/', authenticate, getAllGoals);
router.get('/:id', authenticate, getGoalById);
router.patch('/:id', authenticate, validate(goalPayloadSchema.partial()), editGoalById);
router.delete('/:id', authenticate, deleteGoalById);

module.exports = router;
