function normalizeError(error) {
  if (!error) {
    return undefined;
  }

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  };
}

function requestContext(req) {
  const user = req.user || req.auth || {};

  return {
    method: req.method,
    path: req.originalUrl || req.url,
    user_id: user.user_id,
    role: user.role,
  };
}

function write(level, event, payload = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  const line = JSON.stringify(entry);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

module.exports = {
  info: (event, payload) => write('info', event, payload),
  warn: (event, payload) => write('warn', event, payload),
  error: (event, payload) => write('error', event, payload),
  action: (event, payload) => write('info', event, payload),
  normalizeError,
  requestContext,
};
