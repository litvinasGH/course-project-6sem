const logger = require('../utils/logger');

function notFound(req, res, next) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    logger.warn('request_error', {
      ...logger.requestContext(req),
      status_code: 400,
      error: logger.normalizeError(err),
    });

    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (err.code === 'P2002') {
    logger.warn('request_error', {
      ...logger.requestContext(req),
      status_code: 409,
      error: logger.normalizeError(err),
    });

    return res.status(409).json({ error: 'Unique constraint violation' });
  }

  if (err.code === 'P2025') {
    logger.warn('request_error', {
      ...logger.requestContext(req),
      status_code: 404,
      error: logger.normalizeError(err),
    });

    return res.status(404).json({ error: 'Resource not found' });
  }

  const statusCode = err.statusCode || 500;
  const response = {
    error: statusCode === 500 ? 'Internal server error' : err.message,
  };

  if (err.details) {
    response.details = err.details;
  }

  const logPayload = {
    ...logger.requestContext(req),
    status_code: statusCode,
    error: logger.normalizeError(err),
    details: err.details,
  };

  if (statusCode === 500) {
    logger.error('request_error', logPayload);
  } else {
    logger.warn('request_error', logPayload);
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFound,
  errorHandler,
};
