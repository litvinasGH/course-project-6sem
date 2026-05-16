const prisma = require('../db');
const AppError = require('../utils/appError');
const { formatInterviewResult } = require('../utils/formatters');
const logger = require('../utils/logger');

const resultInclude = {
  interview: {
    include: {
      application: {
        include: {
          vacancy: {
            include: {
              project: true,
            },
          },
        },
      },
      interviewer: true,
    },
  },
};

const interviewInclude = {
  application: {
    include: {
      vacancy: {
        include: {
          project: true,
        },
      },
    },
  },
  interviewer: true,
  result: true,
};

function ensureAssignedInterviewer(interview, user) {
  if (interview.interviewer_id !== user.user_id) {
    throw new AppError('Only the assigned interviewer can manage this result', 403);
  }
}

function ensureProjectOwner(application, user) {
  if (application.vacancy.project.owner_id !== user.user_id) {
    throw new AppError('Project manager can view results only for own projects', 403);
  }
}

function ensureCanViewResult(result, user) {
  const application = result.interview.application;

  if (user.role === 'INTERVIEWER') {
    ensureAssignedInterviewer(result.interview, user);
    return;
  }

  if (user.role === 'PROJECT_MANAGER') {
    ensureProjectOwner(application, user);
    return;
  }

  throw new AppError('Forbidden', 403);
}

function ensureCanViewApplicationResult(application, user) {
  if (user.role === 'CANDIDATE') {
    if (application.user_id !== user.user_id) {
      throw new AppError('Candidate can view only own application result', 403);
    }
    return;
  }

  if (user.role === 'PROJECT_MANAGER') {
    ensureProjectOwner(application, user);
    return;
  }

  throw new AppError('Forbidden', 403);
}

async function findInterview(interviewId) {
  const interview = await prisma.interview.findUnique({
    where: { interview_id: interviewId },
    include: interviewInclude,
  });

  if (!interview) {
    throw new AppError('Interview not found', 404);
  }

  return interview;
}

async function createResult(interviewId, data, interviewer) {
  const interview = await findInterview(interviewId);

  ensureAssignedInterviewer(interview, interviewer);

  if (interview.status !== 'COMPLETED') {
    throw new AppError('Interview must be completed before result can be created', 400);
  }

  if (interview.result) {
    throw new AppError('Interview already has a result', 409);
  }

  try {
    const result = await prisma.interviewResult.create({
      data: {
        interview_id: interviewId,
        score: data.score,
        comment: data.comment,
        recommendation: data.recommendation,
      },
      include: resultInclude,
    });

    logger.action('interview_result_created', {
      result_id: result.result_id,
      interview_id: interviewId,
      interviewer_id: interviewer.user_id,
      score: result.score,
      recommendation: result.recommendation,
    });

    return formatInterviewResult(result);
  } catch (err) {
    if (err.code === 'P2002') {
      logger.warn('interview_result_create_failed', {
        interview_id: interviewId,
        interviewer_id: interviewer.user_id,
        reason: 'result_already_exists',
      });

      throw new AppError('Interview already has a result', 409);
    }

    throw err;
  }
}

async function updateResult(interviewId, data, interviewer) {
  const interview = await findInterview(interviewId);

  ensureAssignedInterviewer(interview, interviewer);

  if (interview.status !== 'COMPLETED') {
    throw new AppError('Only completed interview result can be updated', 400);
  }

  if (!interview.result) {
    throw new AppError('Interview result not found', 404);
  }

  const result = await prisma.interviewResult.update({
    where: { interview_id: interviewId },
    data: {
      score: data.score,
      comment: data.comment,
      recommendation: data.recommendation,
    },
    include: resultInclude,
  });

  logger.action('interview_result_updated', {
    result_id: result.result_id,
    interview_id: interviewId,
    interviewer_id: interviewer.user_id,
    score: result.score,
    recommendation: result.recommendation,
  });

  return formatInterviewResult(result);
}

async function getResultByInterview(interviewId, user) {
  const result = await prisma.interviewResult.findUnique({
    where: { interview_id: interviewId },
    include: resultInclude,
  });

  if (!result) {
    throw new AppError('Interview result not found', 404);
  }

  ensureCanViewResult(result, user);

  return formatInterviewResult(result);
}

async function getResultByApplication(applicationId, user) {
  const application = await prisma.application.findUnique({
    where: { application_id: applicationId },
    include: {
      vacancy: {
        include: {
          project: true,
        },
      },
      interview: {
        include: {
          result: {
            include: resultInclude,
          },
        },
      },
    },
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  ensureCanViewApplicationResult(application, user);

  if (!application.interview || !application.interview.result) {
    throw new AppError('Interview result not found', 404);
  }

  return formatInterviewResult(application.interview.result);
}

module.exports = {
  createResult,
  updateResult,
  getResultByInterview,
  getResultByApplication,
};
