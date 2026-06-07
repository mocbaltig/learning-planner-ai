const express = require('express');
const router = express.Router();
const { getSummary, prometheusMetrics } = require('../controller/metrics');
const authenticate = require('../middleware/authenticate');

/**
 * @openapi
 * components:
 *   schemas:
 *     MetricsSummary:
 *       type: object
 *       properties:
 *         total_ai_calls:
 *           type: integer
 *         token_usage:
 *           type: integer
 *         acceptance_rate:
 *           type: number
 *         avg_response_time:
 *           type: number
 */

/**
 * @openapi
 * /metrics:
 *   get:
 *     tags: [Metrics]
 *     summary: Prometheus metrics in plain text
 *     responses:
 *       200:
 *         description: Prometheus metrics
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/', prometheusMetrics);

/**
 * @openapi
 * /metrics/summary:
 *   get:
 *     tags: [Metrics]
 *     summary: Application metrics in JSON
 *     responses:
 *       200:
 *         description: Metrics JSON summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricsSummary'
 */
router.get('/summary', getSummary);

module.exports = router;
