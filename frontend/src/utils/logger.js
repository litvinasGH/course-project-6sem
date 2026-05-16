const isProduction = import.meta.env.PROD;
const logActionsInProduction = import.meta.env.VITE_FRONTEND_LOG_ACTIONS === 'true';

function normalizePayload(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const blockedKeys = new Set(['password', 'token', 'authorization']);

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (blockedKeys.has(key.toLowerCase())) {
        return [key, '[redacted]'];
      }

      if (value instanceof Error) {
        return [
          key,
          {
            name: value.name,
            message: value.message,
            stack: isProduction ? undefined : value.stack,
          },
        ];
      }

      return [key, value];
    }),
  );
}

function shouldLog(level) {
  if (!isProduction) {
    return true;
  }

  return level === 'warn' || level === 'error' || (level === 'action' && logActionsInProduction);
}

function write(level, event, payload) {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...normalizePayload(payload),
  };

  const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
  console[method](`[frontend] ${event}`, entry);
}

export const logger = {
  info: (event, payload) => write('info', event, payload),
  action: (event, payload) => write('action', event, payload),
  warn: (event, payload) => write('warn', event, payload),
  error: (event, payload) => write('error', event, payload),
};
