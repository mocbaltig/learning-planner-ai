const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { taskPayloadSchema, taskUpdatePayloadSchema } = require('../validator/task-schema');
const { createTask, getTasksByWeekStart, editStatus, editTask } = require('../controller/tasks');

/**
 * @openapi
 * components:
 *   schemas:
 *     TaskPayload:
 *       type: object
 *       required: [goal_id, title, duration_estimate, planned_date, planned_slot]
 *       properties:
 *         goal_id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *         duration_estimate:
 *           type: number
 *           minimum: 25
 *           maximum: 90
 *         planned_date:
 *           type: string
 *           format: date
 *           example: "2026-06-15"
 *         planned_slot:
 *           type: string
 *           enum: [morning, afternoon, evening]
 *         source:
 *           type: string
 *           enum: [manual, ai]
 *           default: manual
 *         rationale:
 *           type: string
 *     TaskUpdatePayload:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *         duration_estimate:
 *           type: number
 *           minimum: 25
 *           maximum: 90
 *         planned_date:
 *           type: string
 *           format: date
 *         planned_slot:
 *           type: string
 *           enum: [morning, afternoon, evening]
 *         source:
 *           type: string
 *           enum: [manual, ai]
 *         rationale:
 *           type: string
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         goal_id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         duration_estimate:
 *           type: number
 *         planned_date:
 *           type: string
 *           format: date
 *         planned_slot:
 *           type: string
 *           enum: [morning, afternoon, evening]
 *         status:
 *           type: string
 *           enum: [todo, in_progress, done, skipped]
 *         actual_duration:
 *           type: number
 *           nullable: true
 *         completed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         source:
 *           type: string
 *           enum: [manual, ai]
 *         rationale:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *     TaskStatusUpdate:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [in_progress, done, skipped]
 *         actual_duration:
 *           type: number
 */

/**
 * @openapi
 * /api/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskPayload'
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authenticate, validate(taskPayloadSchema), createTask);

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get tasks by week or goal
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: week_start
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-06-15"
 *         description: Start of week (YYYY-MM-DD)
 *       - in: query
 *         name: goal_id
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by goal
 *     responses:
 *       200:
 *         description: Tasks retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 week_start:
 *                   type: string
 *                 tasks:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, getTasksByWeekStart);

/**
 * @openapi
 * /api/tasks/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task status with transition validation
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskStatusUpdate'
 *     responses:
 *       200:
 *         description: Task status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/status', authenticate, editStatus);

/**
 * @openapi
 * /api/tasks/{id}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task fields
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdatePayload'
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', authenticate, validate(taskUpdatePayloadSchema), editTask);

module.exports = router;
