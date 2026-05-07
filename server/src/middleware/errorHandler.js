const { ClientError } = require('../exceptions');
const logger = require('../utils/logger');
const z = require('zod');

function errorHandler(err, req, res, _next) {
  logger.error({
    request_id: req.requestId,
    error_type: err.name,
    error_message: err.message,
    route: req.originalUrl,
  });

  if (err instanceof ClientError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof z.ZodError) {
    return res
      .status(400)
      .json({ error: 'Input tidak valid', details: err.errors });
  }

  return res.status(500).json({ error: 'Terjadi kesalahan internal' });
}
module.exports = errorHandler;
