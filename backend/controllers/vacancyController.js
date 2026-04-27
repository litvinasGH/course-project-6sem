const vacancyService = require('../services/vacancyService');

async function getProjectVacancies(req, res) {
  const vacancies = await vacancyService.getProjectVacancies(req.params.projectId);
  res.json({ vacancies });
}

async function createVacancy(req, res) {
  const vacancy = await vacancyService.createVacancy(req.params.projectId, req.body);
  res.status(201).json({ vacancy });
}

module.exports = {
  getProjectVacancies,
  createVacancy,
};
