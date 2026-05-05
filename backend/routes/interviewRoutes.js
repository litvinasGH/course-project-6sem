const express = require('express');
const interviewController = require('../controllers/interviewController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateParams } = require('../middleware/validationMiddleware');
const {
  validateApplicationParams,
  validateInterviewParams,
  validateAssignInterviewBody,
  validateScheduleInterviewBody,
} = require('../utils/validators');

const router = express.Router();

router.post(
  '/applications/:applicationId/interview',
  authenticate,
  authorizeRoles('PROJECT_MANAGER'),
  validateParams(validateApplicationParams),
  validateBody(validateAssignInterviewBody),
  asyncHandler(interviewController.assignInterviewer),
);

router.get(
  '/interviews/assigned/my',
  authenticate,
  authorizeRoles('INTERVIEWER'),
  asyncHandler(interviewController.getMyAssignedInterviews),
);

router.put(
  '/interviews/:interviewId/schedule',
  authenticate,
  authorizeRoles('INTERVIEWER'),
  validateParams(validateInterviewParams),
  validateBody(validateScheduleInterviewBody),
  asyncHandler(interviewController.scheduleInterview),
);

router.put(
  '/interviews/:interviewId/complete',
  authenticate,
  authorizeRoles('INTERVIEWER'),
  validateParams(validateInterviewParams),
  asyncHandler(interviewController.completeInterview),
);

router.put(
  '/interviews/:interviewId/cancel',
  authenticate,
  authorizeRoles('INTERVIEWER', 'PROJECT_MANAGER'),
  validateParams(validateInterviewParams),
  asyncHandler(interviewController.cancelInterview),
);

module.exports = router;
