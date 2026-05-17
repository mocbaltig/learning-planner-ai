const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { Goals, GoalInput } = require('../models/goals.js');
const { NotFoundError, InvariantError } = require('../exceptions');

router.post('/', authenticate, async (req, res, next) => {
  const goalInput = GoalInput.safeParse(req.body);
  if (!goalInput.success) {
    return next(goalInput.error);
  }
  const goal = await Goals.create({ userId: req.user.id, ...goalInput.data });
  if (!goal) {
    return next(new InvariantError('Gagal membuat goal'));
  }
  res.status(201).json(goal);
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const goals = await Goals.getAll(req.user.id);
    res.json(goals);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  const goal = await Goals.findById(req.params.id, req.user.id);
  if (!goal) {
    return next(new NotFoundError('Goal tidak ditemukan'));
  }
  res.json(goal);
});

router.patch('/:id', authenticate, async (req, res, next) => {
  const goalInput = GoalInput.partial().safeParse(req.body);
  if (!goalInput.success) {
    return next(goalInput.error);
  }

  const goal = await Goals.update({
    id: req.params.id,
    userId: req.user.id,
    ...goalInput.data,
  });

  if (!goal) {
    return next(new NotFoundError('Goal tidak ditemukan'));
  }

  res.json(goal);
});

router.delete('/:id', authenticate, async (req, res, next) => {
  const goal = await Goals.delete(req.params.id, req.user.id);
  if (!goal) {
    return next(new NotFoundError('Goal tidak ditemukan'));
  }
  res.status(204).end();
});

module.exports = router;
