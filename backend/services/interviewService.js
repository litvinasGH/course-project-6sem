const prisma = require('../db');
const AppError = require('../utils/appError');
const { formatInterview } = require('../utils/formatters');

const FINAL_APPLICATION_STATUSES = new Set(['ACCEPTED', 'REJECTED', 'WITHDRAWN']);

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
};

function ensureProjectOwner(application, user) {
  const ownerId = application.vacancy.project.owner_id;

  if (ownerId !== user.user_id) {
    throw new AppError('Only the project owner can manage this interview', 403);
  }
}

function ensureAssignedInterviewer(interview, user) {
  if (interview.interviewer_id !== user.user_id) {
    throw new AppError('Only the assigned interviewer can manage this interview', 403);
  }
}

function ensureInterviewCanBeChanged(interview) {
  if (interview.status === 'CANCELED') {
    throw new AppError('Canceled interview cannot be changed', 400);
  }

  if (interview.status === 'COMPLETED') {
    throw new AppError('Completed interview cannot be changed', 400);
  }
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

async function assignInterviewer(applicationId, interviewerId, projectManager) {
  const application = await prisma.application.findUnique({
    where: { application_id: applicationId },
    include: {
      interview: true,
      vacancy: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  ensureProjectOwner(application, projectManager);

  if (FINAL_APPLICATION_STATUSES.has(application.status)) {
    throw new AppError('Cannot assign interview for a final application', 400);
  }

  if (application.interview) {
    throw new AppError('Application already has an interview', 409);
  }

  const interviewer = await prisma.user.findUnique({
    where: { user_id: interviewerId },
  });

  if (!interviewer) {
    throw new AppError('Interviewer not found', 404);
  }

  if (interviewer.role !== 'INTERVIEWER') {
    throw new AppError('Selected user is not an interviewer', 400);
  }

  try {
    const interview = await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { application_id: applicationId },
        data: { status: 'INTERVIEW_ASSIGNED' },
      });

      return tx.interview.create({
        data: {
          application_id: applicationId,
          interviewer_id: interviewerId,
          status: 'ASSIGNED',
        },
        include: interviewInclude,
      });
    });

    return formatInterview(interview);
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError('Application already has an interview', 409);
    }

    throw err;
  }
}

async function getAssignedInterviews(interviewerId) {
  const interviews = await prisma.interview.findMany({
    where: { interviewer_id: interviewerId },
    include: interviewInclude,
    orderBy: [
      { date: 'asc' },
      { interview_id: 'asc' },
    ],
  });

  return interviews.map(formatInterview);
}

async function scheduleInterview(interviewId, date, interviewer) {
  const interview = await findInterview(interviewId);

  ensureAssignedInterviewer(interview, interviewer);
  ensureInterviewCanBeChanged(interview);

  const updatedInterview = await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { application_id: interview.application_id },
      data: { status: 'INTERVIEW_SCHEDULED' },
    });

    return tx.interview.update({
      where: { interview_id: interviewId },
      data: {
        date,
        status: 'SCHEDULED',
      },
      include: interviewInclude,
    });
  });

  return formatInterview(updatedInterview);
}

async function completeInterview(interviewId, interviewer) {
  const interview = await findInterview(interviewId);

  ensureAssignedInterviewer(interview, interviewer);

  if (interview.status === 'CANCELED') {
    throw new AppError('Canceled interview cannot be completed', 400);
  }

  if (interview.status !== 'SCHEDULED' || !interview.date) {
    throw new AppError('Only a scheduled interview can be completed', 400);
  }

  const updatedInterview = await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { application_id: interview.application_id },
      data: { status: 'INTERVIEW_COMPLETED' },
    });

    return tx.interview.update({
      where: { interview_id: interviewId },
      data: { status: 'COMPLETED' },
      include: interviewInclude,
    });
  });

  return formatInterview(updatedInterview);
}

async function cancelInterview(interviewId, user) {
  const interview = await findInterview(interviewId);

  if (interview.status === 'COMPLETED') {
    throw new AppError('Completed interview cannot be canceled', 400);
  }

  if (interview.status === 'CANCELED') {
    throw new AppError('Interview is already canceled', 400);
  }

  if (user.role === 'INTERVIEWER') {
    ensureAssignedInterviewer(interview, user);
  } else if (user.role === 'PROJECT_MANAGER') {
    ensureProjectOwner(interview.application, user);
  } else {
    throw new AppError('Forbidden', 403);
  }

  const updatedInterview = await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { application_id: interview.application_id },
      data: { status: 'UNDER_REVIEW' },
    });

    return tx.interview.update({
      where: { interview_id: interviewId },
      data: { status: 'CANCELED' },
      include: interviewInclude,
    });
  });

  return formatInterview(updatedInterview);
}

module.exports = {
  assignInterviewer,
  getAssignedInterviews,
  scheduleInterview,
  completeInterview,
  cancelInterview,
};
