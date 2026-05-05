const ROLES = new Set(['CANDIDATE', 'INTERVIEWER', 'PROJECT_MANAGER']);
const VACANCY_STATUSES = new Set(['OPEN', 'CLOSED', 'PAUSED']);
const INTERVIEW_RECOMMENDATIONS = new Set([
  'RECOMMENDED',
  'NOT_RECOMMENDED',
  'RESERVE',
  'ADDITIONAL_INTERVIEW',
]);

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

function normalizeInterviewRecommendation(recommendation) {
  const value = String(recommendation || '').trim().toUpperCase();

  if (INTERVIEW_RECOMMENDATIONS.has(value)) {
    return value;
  }

  return undefined;
}

function normalizeApplicationDecisionStatus(status) {
  const value = String(status || '').trim().toUpperCase();

  if (value === 'ACCEPTED' || value === 'REJECTED') {
    return value;
  }

  return undefined;
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

function validateApplicationParams(params) {
  const result = parsePositiveInt(params.applicationId, 'applicationId');

  return result.error
    ? { errors: [result.error], value: {} }
    : { errors: [], value: { applicationId: result.value } };
}

function validateInterviewParams(params) {
  const result = parsePositiveInt(params.interviewId, 'interviewId');

  return result.error
    ? { errors: [result.error], value: {} }
    : { errors: [], value: { interviewId: result.value } };
}

function validateAssignInterviewBody(body) {
  const errors = [];
  const rawInterviewerId = body.interviewer_id ?? body.interviewerId;
  const interviewerId = parsePositiveInt(rawInterviewerId, 'interviewer_id');

  if (interviewerId.error) {
    errors.push(interviewerId.error);
  }

  return {
    errors,
    value: { interviewer_id: interviewerId.value },
  };
}

function validateScheduleInterviewBody(body) {
  const errors = [];
  const rawDate = body.date;
  const date = new Date(rawDate);

  if (!rawDate || Number.isNaN(date.getTime())) {
    errors.push('date must be a valid date string');
  }

  return {
    errors,
    value: { date },
  };
}

function validateInterviewResultBody(body) {
  const errors = [];
  const score = Number(body.score);
  const comment = isNonEmptyString(body.comment) ? body.comment.trim() : null;
  const recommendation = normalizeInterviewRecommendation(body.recommendation);

  if (!Number.isInteger(score) || score < 0 || score > 10) {
    errors.push('score must be an integer from 0 to 10');
  }

  if (!recommendation) {
    errors.push('recommendation must be recommended, not_recommended, reserve, or additional_interview');
  }

  return {
    errors,
    value: { score, comment, recommendation },
  };
}

function validateApplicationDecisionBody(body) {
  const errors = [];
  const status = normalizeApplicationDecisionStatus(body.status);
  const comment = isNonEmptyString(body.comment) ? body.comment.trim() : null;

  if (!status) {
    errors.push('status must be accepted or rejected');
  }

  return {
    errors,
    value: { status, comment },
  };
}

module.exports = {
  validateRegisterBody,
  validateLoginBody,
  validateProjectBody,
  validateVacancyBody,
  validateProjectParams,
  validateVacancyParams,
  validateApplicationParams,
  validateInterviewParams,
  validateAssignInterviewBody,
  validateScheduleInterviewBody,
  validateInterviewResultBody,
  validateApplicationDecisionBody,
};
