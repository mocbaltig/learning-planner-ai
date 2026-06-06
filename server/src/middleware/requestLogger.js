const { randomUUID } = require('crypto');
const logger = require('../utils/logger');
const { httpRequestCount, httpLatency } = require('../utils/metrics');

function requestLogger(req, res, next) {
  req.requestId = randomUUID();
  const start = Date.now();

  res.on('finish', () => {
    const route = req.path;
    const status = res.statusCode;
    const durationMs = Date.now() - start;

    httpRequestCount.inc({ method: req.method, route, status });
    httpLatency.observe({ method: req.method, route }, durationMs);

    logger.info({
      request_id: req.requestId,
      method: req.method,
      route: req.originalUrl,
      status_code: status,
      duration_ms: durationMs,
      user_id: req.user?.id || null,
    });
  });

  next();
}

module.exports = requestLogger;
