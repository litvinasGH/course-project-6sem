const { performance } = require('node:perf_hooks');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const startedAt = performance.now();

  res.on('finish', () => {
    const responseTimeMs = Number((performance.now() - startedAt).toFixed(1));
    const payload = {
      ...logger.requestContext(req),
      status_code: res.statusCode,
      response_time_ms: responseTimeMs,
    };

    if (res.statusCode >= 500) {
      logger.error('http_request', payload);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn('http_request', payload);
      return;
    }

    logger.info('http_request', payload);
  });

  next();
}

module.exports = {
  requestLogger,
};
