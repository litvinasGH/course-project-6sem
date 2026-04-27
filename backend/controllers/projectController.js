const projectService = require('../services/projectService');

async function getProjects(req, res) {
  const projects = await projectService.getProjects();
  res.json({ projects });
}

async function createProject(req, res) {
  const project = await projectService.createProject(req.body, req.user.user_id);
  res.status(201).json({ project });
}

module.exports = {
  getProjects,
  createProject,
};
