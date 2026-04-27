const ROLES = new Set(['CANDIDATE', 'INTERVIEWER', 'PROJECT_MANAGER']);
const VACANCY_STATUSES = new Set(['OPEN', 'CLOSED', 'PAUSED']);

const ROLE_ALIASES = {
  candidate: 'CANDIDATE',
  interviewer: 'INTERVIEWER',
  project_manager: 'PROJECT_MANAGER',
  'project-manager': 'PROJECT_MANAGER',
  'project manager': 'PROJECT_MANAGER',
};

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeRole(role) {
  const value = String(role || 'CANDIDATE').trim();
  const upperValue = value.toUpperCase();

  if (ROLES.has(upperValue)) {
    return upperValue;
  }

  return ROLE_ALIASES[value.toLowerCase()];
}

function normalizeVacancyStatus(status) {
  if (!status) {
    return 'OPEN';
  }

  const value = String(status).trim().toUpperCase();
  return VACANCY_STATUSES.has(value) ? value : undefined;
}

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${fieldName} must be a positive integer` };
  }

  return { value: parsed };
}

function validateRegisterBody(body) {
  const errors = [];
  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const role = normalizeRole(body.role);

  if (!isNonEmptyString(name)) {
    errors.push('name is required');
  }

  if (!email || !email.includes('@')) {
    errors.push('valid email is required');
  }

  if (password.length < 6) {
    errors.push('password must contain at least 6 characters');
  }

  if (!role) {
    errors.push('role must be CANDIDATE, INTERVIEWER, or PROJECT_MANAGER');
  }

  return {
    errors,
    value: { name, email, password, role },
  };
}

function validateLoginBody(body) {
  const errors = [];
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email || !email.includes('@')) {
    errors.push('valid email is required');
  }

  if (!password) {
    errors.push('password is required');
  }

  return {
    errors,
    value: { email, password },
  };
}

function validateProjectBody(body) {
  const errors = [];
  const name = String(body.name || '').trim();
  const description = isNonEmptyString(body.description) ? body.description.trim() : null;

  if (!isNonEmptyString(name)) {
    errors.push('name is required');
  }

  return {
    errors,
    value: { name, description },
  };
}

function validateVacancyBody(body) {
  const errors = [];
  const title = String(body.title || '').trim();
  const description = isNonEmptyString(body.description) ? body.description.trim() : null;
  const status = normalizeVacancyStatus(body.status);

  if (!isNonEmptyString(title)) {
    errors.push('title is required');
  }

  if (!status) {
    errors.push('status must be OPEN, CLOSED, or PAUSED');
  }

  return {
    errors,
    value: { title, description, status },
  };
}

function validateProjectParams(params) {
  const result = parsePositiveInt(params.projectId, 'projectId');

  return result.error
    ? { errors: [result.error], value: {} }
    : { errors: [], value: { projectId: result.value } };
}

function validateVacancyParams(params) {
  const result = parsePositiveInt(params.vacancyId, 'vacancyId');

  return result.error
    ? { errors: [result.error], value: {} }
    : { errors: [], value: { vacancyId: result.value } };
}

module.exports = {
  validateRegisterBody,
  validateLoginBody,
  validateProjectBody,
  validateVacancyBody,
  validateProjectParams,
  validateVacancyParams,
};
