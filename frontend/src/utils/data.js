export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function formatDateTime(value) {
  if (!value) {
    return 'Not scheduled';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString();
}

export function toDateTimeLocalValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function compactText(value, fallback = 'No data') {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }

  return value;
}
