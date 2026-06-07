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

/**
 * @openapi
 * components:
 *   schemas:
 *     GoalPayload:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         description:
 *           type: string
 *         deadline:
 *           type: string
 *           format: date
 *           example: "2026-06-30"
 *     Goal:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         deadline:
 *           type: string
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         task_total:
 *           type: integer
 *         task_done_count:
 *           type: integer
 *     GoalWithTasks:
 *       type: object
 *       allOf:
 *         - $ref: '#/components/schemas/Goal'
 *         - type: object
 *           properties:
 *             tasks:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */

/**
 * @openapi
 * /api/goals:
 *   post:
 *     tags: [Goals]
 *     summary: Create a new goal
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoalPayload'
 *     responses:
 *       201:
 *         description: Goal created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authenticate, validate(goalPayloadSchema), createGoal);

/**
 * @openapi
 * /api/goals:
 *   get:
 *     tags: [Goals]
 *     summary: List all goals for current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Goals list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Goal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, getAllGoals);

/**
 * @openapi
 * /api/goals/{id}:
 *   get:
 *     tags: [Goals]
 *     summary: Get a goal by ID with its tasks
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Goal with tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoalWithTasks'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authenticate, getGoalById);

/**
 * @openapi
 * /api/goals/{id}:
 *   patch:
 *     tags: [Goals]
 *     summary: Update a goal
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
 *             $ref: '#/components/schemas/GoalPayload'
 *     responses:
 *       200:
 *         description: Goal updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', authenticate, validate(goalPayloadSchema.partial()), editGoalById);

/**
 * @openapi
 * /api/goals/{id}:
 *   delete:
 *     tags: [Goals]
 *     summary: Delete a goal
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Goal deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, deleteGoalById);

module.exports = router;
