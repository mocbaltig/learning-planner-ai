const express = require('express');
const authenticate = require('../middleware/authenticate');
const { getWeeklyProgress, getTrendProgress } = require('../controller/progress');
const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     WeeklyProgress:
 *       type: object
 *       properties:
 *         week:
 *           type: string
 *           example: "2026-W15"
 *         planned_hours:
 *           type: number
 *         completed_hours:
 *           type: number
 *         completion_rate:
 *           type: number
 *     TrendProgress:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           week:
 *             type: string
 *           planned:
 *             type: number
 *           completed:
 *             type: number
 *           rate:
 *             type: number
 */

/**
 * @openapi
 * /api/progress/weekly:
 *   get:
 *     tags: [Progress]
 *     summary: Get weekly progress summary
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: week
 *         required: true
 *         schema:
 *           type: string
 *           example: "2026-W15"
 *         description: Week in ISO format (YYYY-Wxx)
 *     responses:
 *       200:
 *         description: Weekly progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeeklyProgress'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/weekly', authenticate, getWeeklyProgress);
/**
 * @openapi
 * /api/progress/trend:
 *   get:
 *     tags: [Progress]
 *     summary: Get progress trend over time
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Progress trend history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrendProgress'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/trend', authenticate, getTrendProgress);

module.exports = router;
