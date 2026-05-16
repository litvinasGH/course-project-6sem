export const ROLES = {
  candidate: 'Candidate',
  interviewer: 'Interviewer',
  project_manager: 'Project Manager',
};

export const ROLE_OPTIONS = [
  { value: 'CANDIDATE', label: 'Candidate' },
  { value: 'INTERVIEWER', label: 'Interviewer' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
];

export function roleLabel(role) {
  return ROLES[role] || role || 'Unknown';
}

export function isManager(user) {
  return user?.role === 'project_manager';
}

export function isCandidate(user) {
  return user?.role === 'candidate';
}

export function isInterviewer(user) {
  return user?.role === 'interviewer';
}
