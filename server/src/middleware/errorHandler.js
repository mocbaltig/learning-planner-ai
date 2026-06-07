const { ClientError } = require('../exceptions');
const logger = require('../utils/logger');
const z = require('zod');

/**
 * @openapi
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Human-readable error message
 *         details:
 *           type: array
 *           description: Validation error details (Zod)
 *           items:
 *             type: object
 *   responses:
 *     BadRequest:
 *       description: Invalid input
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Unauthorized:
 *       description: Authentication required or token expired
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Conflict:
 *       description: Resource already exists
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     UnprocessableEntity:
 *       description: AI output validation failed
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     TooManyRequests:
 *       description: Rate limit exceeded
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 */

function errorHandler(err, req, res, _next) {
  logger.error({
    request_id: req.requestId,
    error_type: err.name,
    error_message: err.message,
    route: req.originalUrl,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });

  if (err instanceof ClientError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Input tidak valid', details: err.errors });
  }

  return res.status(500).json({ error: 'Terjadi kesalahan internal' });
}
module.exports = errorHandler;
