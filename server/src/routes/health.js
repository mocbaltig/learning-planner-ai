const express = require('express');
const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: ok
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Server health check
 *     responses:
 *       200:
 *         description: Server is alive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/', (req, res, next) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
