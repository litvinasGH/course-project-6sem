const interviewService = require('../services/interviewService');

async function assignInterviewer(req, res) {
  const interview = await interviewService.assignInterviewer(
    req.params.applicationId,
    req.body.interviewer_id,
    req.user,
  );

  res.status(201).json({ interview });
}

async function getMyAssignedInterviews(req, res) {
  const interviews = await interviewService.getAssignedInterviews(req.user.user_id);
  res.json({ interviews });
}

async function scheduleInterview(req, res) {
  const interview = await interviewService.scheduleInterview(
    req.params.interviewId,
    req.body.date,
    req.user,
  );

  res.json({ interview });
}

async function completeInterview(req, res) {
  const interview = await interviewService.completeInterview(req.params.interviewId, req.user);
  res.json({ interview });
}

async function cancelInterview(req, res) {
  const interview = await interviewService.cancelInterview(req.params.interviewId, req.user);
  res.json({ interview });
}

module.exports = {
  assignInterviewer,
  getMyAssignedInterviews,
  scheduleInterview,
  completeInterview,
  cancelInterview,
};
