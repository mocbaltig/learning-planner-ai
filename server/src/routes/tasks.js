// TODO: Implementasikan task endpoints.
// Lihat modul Cycle 1 (POST — accept flow) dan Cycle 2 (GET, PATCH status).
// POST /, GET /, PATCH /:id/status
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { Tasks } = require('../models/tasks');
const logger = require('../utils/logger');
const authenticate = require('../middleware/authenticate');
const { InvariantError } = require('../exceptions');

const TaskInput = z.object({
  goal_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  duration_estimate: z.number().min(25).max(90),
  planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  planned_slot: z.enum(['morning', 'afternoon', 'evening']),
  source: z.enum(['manual', 'ai']).default('manual'),
  rationale: z.string().optional(),
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const taskInput = TaskInput.safeParse(req.body);
    if (!taskInput.success) {
      return next(taskInput.error);
    }
    const task = await Tasks.create({ ...taskInput.data, status: 'todo' });

    if (!task) {
      return next(new InvariantError('Gagal membuat task'));
    }

    logger.info({
      request_id: req.requestId,
      action: 'task_created',
      source: taskInput.data.source,
      task_id: task.id,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
