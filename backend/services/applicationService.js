const prisma = require('../db');
const AppError = require('../utils/appError');
const { formatApplication } = require('../utils/formatters');
const logger = require('../utils/logger');

async function applyToVacancy(vacancyId, userId) {
  const vacancy = await prisma.vacancy.findUnique({
    where: { vacancy_id: vacancyId },
  });

  if (!vacancy) {
    throw new AppError('Vacancy not found', 404);
  }

  if (vacancy.status !== 'OPEN') {
    throw new AppError('Cannot apply to a non-open vacancy', 400);
  }

  try {
    const application = await prisma.application.create({
      data: {
        user_id: userId,
        vacancy_id: vacancyId,
        status: 'SUBMITTED',
      },
      include: {
        vacancy: {
          include: {
            project: true,
          },
        },
      },
    });

    logger.action('application_created', {
      application_id: application.application_id,
      user_id: userId,
      vacancy_id: vacancyId,
    });

    return formatApplication(application);
  } catch (err) {
    if (err.code === 'P2002') {
      logger.warn('application_create_failed', {
        user_id: userId,
        vacancy_id: vacancyId,
        reason: 'duplicate_application',
      });

      throw new AppError('User has already applied to this vacancy', 409);
    }

    throw err;
  }
}

async function getMyApplications(userId) {
  const applications = await prisma.application.findMany({
    where: { user_id: userId },
    include: {
      vacancy: {
        include: {
          project: true,
        },
      },
    },
    orderBy: {
      application_id: 'desc',
    },
  });

  return applications.map(formatApplication);
}

async function makeDecision(applicationId, data, projectManager) {
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
          result: true,
        },
      },
    },
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (application.vacancy.project.owner_id !== projectManager.user_id) {
    throw new AppError('Only the project owner can make this decision', 403);
  }

  if (application.decision_at || application.status === 'ACCEPTED' || application.status === 'REJECTED') {
    throw new AppError('Decision has already been made', 400);
  }

  if (!application.interview) {
    throw new AppError('Application has no interview', 400);
  }

  if (application.interview.status !== 'COMPLETED') {
    throw new AppError('Interview must be completed before final decision', 400);
  }

  if (!application.interview.result) {
    throw new AppError('Interview result is required before final decision', 400);
  }

  const updatedApplication = await prisma.application.update({
    where: { application_id: applicationId },
    data: {
      status: data.status,
      decision_by: projectManager.user_id,
      decision_comment: data.comment,
      decision_at: new Date(),
    },
    include: {
      vacancy: {
        include: {
          project: true,
        },
      },
    },
  });

  logger.action('application_decision_made', {
    application_id: applicationId,
    status: updatedApplication.status,
    decision_by: projectManager.user_id,
  });

  return formatApplication(updatedApplication);
}

module.exports = {
  applyToVacancy,
  getMyApplications,
  makeDecision,
};
