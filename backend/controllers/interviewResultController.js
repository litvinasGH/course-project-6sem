const interviewResultService = require('../services/interviewResultService');

async function createResult(req, res) {
  const result = await interviewResultService.createResult(
    req.params.interviewId,
    req.body,
    req.user,
  );

  res.status(201).json({ result });
}

async function updateResult(req, res) {
  const result = await interviewResultService.updateResult(
    req.params.interviewId,
    req.body,
    req.user,
  );

  res.json({ result });
}

async function getResultByInterview(req, res) {
  const result = await interviewResultService.getResultByInterview(req.params.interviewId, req.user);
  res.json({ result });
}

async function getResultByApplication(req, res) {
  const result = await interviewResultService.getResultByApplication(
    req.params.applicationId,
    req.user,
  );

  res.json({ result });
}

module.exports = {
  createResult,
  updateResult,
  getResultByInterview,
  getResultByApplication,
};
