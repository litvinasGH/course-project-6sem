const applicationService = require('../services/applicationService');

async function applyToVacancy(req, res) {
  const application = await applicationService.applyToVacancy(
    req.params.vacancyId,
    req.user.user_id,
  );

  res.status(201).json({ application });
}

async function getMyApplications(req, res) {
  const applications = await applicationService.getMyApplications(req.user.user_id);
  res.json({ applications });
}

module.exports = {
  applyToVacancy,
  getMyApplications,
};
