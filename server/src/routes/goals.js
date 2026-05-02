// TODO: Implementasikan CRUD endpoints untuk goals.
// Lihat modul Scaffolding — sub modul "Authentication & CRUD".
// POST /, GET /, PATCH /:id, DELETE /:id

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../utils/db');
const authenticate = require('../middleware/authenticate');
const Goals = require('../models/goals');

const GoalInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = GoalInput.parse(req.body);
    const goal = await Goals.create({ userId: req.user.id, ...data });
    if (!goal) {
      return res.status(400).json({ error: 'Gagal membuat goal' });
    }
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
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
  try {
    const goal = await Goals.findById(req.params.id, req.user.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal tidak ditemukan' });
    }
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const data = GoalInput.partial().parse(req.body);
    const goal = await Goals.update({
      id: req.params.id,
      userId: req.user.id,
      ...data,
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal tidak ditemukan' });
    }

    res.json(goal);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const goal = await Goals.delete(req.params.id, req.user.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal tidak ditemukan' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
