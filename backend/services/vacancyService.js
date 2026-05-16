const prisma = require('../db');
const AppError = require('../utils/appError');
const { formatVacancy } = require('../utils/formatters');
const logger = require('../utils/logger');

async function getProjectVacancies(projectId) {
  const project = await prisma.project.findUnique({
    where: { project_id: projectId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const vacancies = await prisma.vacancy.findMany({
    where: { project_id: projectId },
    include: {
      project: true,
    },
    orderBy: {
      vacancy_id: 'asc',
    },
  });

  return vacancies.map(formatVacancy);
}

async function createVacancy(projectId, data) {
  const project = await prisma.project.findUnique({
    where: { project_id: projectId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const vacancy = await prisma.vacancy.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      project_id: projectId,
    },
    include: {
      project: true,
    },
  });

  logger.action('vacancy_created', {
    vacancy_id: vacancy.vacancy_id,
    project_id: projectId,
    status: vacancy.status,
  });

  return formatVacancy(vacancy);
}

module.exports = {
  getProjectVacancies,
  createVacancy,
};
