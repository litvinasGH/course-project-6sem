function notFound(req, res, next) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Unique constraint violation' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const statusCode = err.statusCode || 500;
  const response = {
    error: statusCode === 500 ? 'Internal server error' : err.message,
  };

  if (err.details) {
    response.details = err.details;
  }

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFound,
  errorHandler,
};
