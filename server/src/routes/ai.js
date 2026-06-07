const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { clientSuggestPayloadSchema, reschedulePayloadSchema } = require('../validator/ai-schema');
const {
  createSuggestion,
  editLatestRecommendation,
  editRecommendationById,
  reschedule,
  getTokenUsage,
} = require('../controller/ai');

/**
 * @openapi
 * components:
 *   schemas:
 *     AISuggestPayload:
 *       type: object
 *       required: [goal_id, week_start]
 *       properties:
 *         goal_id:
 *           type: string
 *           format: uuid
 *         week_start:
 *           type: string
 *           format: date
 *           example: "2026-06-15"
 *     AIReschedulePayload:
 *       type: object
 *       required: [task_ids]
 *       properties:
 *         task_ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           minItems: 1
 *     AITask:
 *       type: object
 *       properties:
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
 *         rationale:
 *           type: string
 *     AIRescheduleTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         duration_estimate:
 *           type: number
 *         planned_date:
 *           type: string
 *           format: date
 *         planned_slot:
 *           type: string
 *           enum: [morning, afternoon, evening]
 *         rationale:
 *           type: string
 *     AISuggestion:
 *       type: object
 *       properties:
 *         tasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AITask'
 *         summary:
 *           type: string
 *     AIReschedule:
 *       type: object
 *       properties:
 *         tasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AIRescheduleTask'
 *         summary:
 *           type: string
 *     AIRecommendationStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         status:
 *           type: string
 *     TokenUsage:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           batch:
 *             type: integer
 *           recommendation_count:
 *             type: integer
 *           total_tokens:
 *             type: integer
 */

/**
 * @openapi
 * /api/ai/plan/suggest:
 *   post:
 *     tags: [AI]
 *     summary: Generate AI task suggestions for a goal and week
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AISuggestPayload'
 *     responses:
 *       200:
 *         description: AI suggestion generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AISuggestion'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/plan/suggest',
  authenticate,
  validate(clientSuggestPayloadSchema),
  createSuggestion,
);

/**
 * @openapi
 * /api/ai/plan/reschedule:
 *   post:
 *     tags: [AI]
 *     summary: AI-powered task rescheduling
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIReschedulePayload'
 *     responses:
 *       200:
 *         description: Reschedule plan generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIReschedule'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/plan/reschedule',
  authenticate,
  validate(reschedulePayloadSchema),
  reschedule,
);

// NOTE: buat route ini karena pada `/api/ai/plan/suggest` id ai_recommendations ga dikirim ke client

/**
 * @openapi
 * /api/ai/recommendations/latest:
 *   patch:
 *     tags: [AI]
 *     summary: Accept or reject the latest recommendation
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recommendation status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIRecommendationStatus'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/recommendations/latest', authenticate, editLatestRecommendation);

/**
 * @openapi
 * /api/ai/recommendations/{id}:
 *   patch:
 *     tags: [AI]
 *     summary: Accept or reject a recommendation by ID
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
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recommendation status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIRecommendationStatus'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/recommendations/:id', authenticate, editRecommendationById);

/**
 * @openapi
 * /api/ai/token-usage:
 *   get:
 *     tags: [AI]
 *     summary: Get user AI token usage history
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Token usage history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenUsage'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/token-usage', authenticate, getTokenUsage);

module.exports = router;
