function formatEnum(value) {
  return value ? value.toLowerCase() : value;
}

function formatUser(user) {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: formatEnum(user.role),
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function formatProject(project) {
  return {
    project_id: project.project_id,
    name: project.name,
    description: project.description,
    owner_id: project.owner_id,
    owner: project.owner ? formatUser(project.owner) : undefined,
    created_at: project.created_at,
    updated_at: project.updated_at,
  };
}

function formatVacancy(vacancy) {
  return {
    vacancy_id: vacancy.vacancy_id,
    title: vacancy.title,
    description: vacancy.description,
    status: formatEnum(vacancy.status),
    project_id: vacancy.project_id,
    project: vacancy.project ? formatProject(vacancy.project) : undefined,
    created_at: vacancy.created_at,
    updated_at: vacancy.updated_at,
  };
}

function formatApplication(application) {
  return {
    application_id: application.application_id,
    user_id: application.user_id,
    vacancy_id: application.vacancy_id,
    status: formatEnum(application.status),
    decision_by: application.decision_by,
    decision_comment: application.decision_comment,
    decision_at: application.decision_at,
    vacancy: application.vacancy ? formatVacancy(application.vacancy) : undefined,
    created_at: application.created_at,
    updated_at: application.updated_at,
  };
}

function formatInterview(interview) {
  return {
    interview_id: interview.interview_id,
    application_id: interview.application_id,
    interviewer_id: interview.interviewer_id,
    date: interview.date,
    status: formatEnum(interview.status),
    application: interview.application ? formatApplication(interview.application) : undefined,
    interviewer: interview.interviewer ? formatUser(interview.interviewer) : undefined,
    created_at: interview.created_at,
    updated_at: interview.updated_at,
  };
}

function formatInterviewResult(result) {
  return {
    result_id: result.result_id,
    interview_id: result.interview_id,
    score: result.score,
    comment: result.comment,
    recommendation: formatEnum(result.recommendation),
    interview: result.interview ? formatInterview(result.interview) : undefined,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
}

module.exports = {
  formatUser,
  formatProject,
  formatVacancy,
  formatApplication,
  formatInterview,
  formatInterviewResult,
};
