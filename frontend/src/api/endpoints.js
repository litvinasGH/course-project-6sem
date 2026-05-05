import api from './client';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const projectApi = {
  list: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  vacancies: (projectId) => api.get(`/projects/${projectId}/vacancies`),
  createVacancy: (projectId, data) => api.post(`/projects/${projectId}/vacancies`, data),
};

export const vacancyApi = {
  apply: (vacancyId) => api.post(`/vacancies/${vacancyId}/applications`, {}),
  applications: (vacancyId) => api.get(`/vacancies/${vacancyId}/applications`),
};

export const applicationApi = {
  mine: () => api.get('/applications/my'),
  result: (applicationId) => api.get(`/applications/${applicationId}/result`),
  decide: (applicationId, data) => api.put(`/applications/${applicationId}/decision`, data),
  assignInterview: (applicationId, interviewerId) => (
    api.post(`/applications/${applicationId}/interview`, { interviewer_id: Number(interviewerId) })
  ),
};

export const interviewApi = {
  assigned: () => api.get('/interviews/assigned/my'),
  schedule: (interviewId, date) => api.put(`/interviews/${interviewId}/schedule`, { date }),
  complete: (interviewId) => api.put(`/interviews/${interviewId}/complete`, {}),
  result: (interviewId) => api.get(`/interviews/${interviewId}/result`),
  createResult: (interviewId, data) => api.post(`/interviews/${interviewId}/result`, data),
  updateResult: (interviewId, data) => api.put(`/interviews/${interviewId}/result`, data),
};
