// POST /, GET /, PATCH /:id/status, PATCH /:id
const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { taskPayloadSchema, taskUpdatePayloadSchema } = require('../validator/task-schema');
const { createTask, getTasksByWeekStart, editStatus, editTask } = require('../controller/tasks');

router.post('/', authenticate, validate(taskPayloadSchema), createTask);
router.get('/', authenticate, getTasksByWeekStart);
router.patch('/:id/status', authenticate, editStatus);
router.patch('/:id', authenticate, validate(taskUpdatePayloadSchema), editTask);

module.exports = router;
