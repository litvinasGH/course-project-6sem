const prisma = require('../db');
const AppError = require('../utils/appError');
const { formatApplication } = require('../utils/formatters');

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

    return formatApplication(application);
  } catch (err) {
    if (err.code === 'P2002') {
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

module.exports = {
  applyToVacancy,
  getMyApplications,
};
