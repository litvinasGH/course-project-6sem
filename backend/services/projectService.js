const prisma = require('../db');
const { formatProject } = require('../utils/formatters');
const logger = require('../utils/logger');

async function getProjects() {
  const projects = await prisma.project.findMany({
    include: {
      owner: true,
    },
    orderBy: {
      project_id: 'asc',
    },
  });

  return projects.map(formatProject);
}

async function createProject(data, ownerId) {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      owner_id: ownerId,
    },
    include: {
      owner: true,
    },
  });

  logger.action('project_created', {
    project_id: project.project_id,
    owner_id: ownerId,
  });

  return formatProject(project);
}

module.exports = {
  getProjects,
  createProject,
};
