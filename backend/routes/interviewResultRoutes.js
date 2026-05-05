const express = require('express');
const interviewResultController = require('../controllers/interviewResultController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateParams } = require('../middleware/validationMiddleware');
const {
  validateApplicationParams,
  validateInterviewParams,
  validateInterviewResultBody,
} = require('../utils/validators');

const router = express.Router();

router.post(
  '/interviews/:interviewId/result',
  authenticate,
  authorizeRoles('INTERVIEWER'),
  validateParams(validateInterviewParams),
  validateBody(validateInterviewResultBody),
  asyncHandler(interviewResultController.createResult),
);

router.put(
  '/interviews/:interviewId/result',
  authenticate,
  authorizeRoles('INTERVIEWER'),
  validateParams(validateInterviewParams),
  validateBody(validateInterviewResultBody),
  asyncHandler(interviewResultController.updateResult),
);

router.get(
  '/interviews/:interviewId/result',
  authenticate,
  authorizeRoles('INTERVIEWER', 'PROJECT_MANAGER'),
  validateParams(validateInterviewParams),
  asyncHandler(interviewResultController.getResultByInterview),
);

router.get(
  '/applications/:applicationId/result',
  authenticate,
  authorizeRoles('CANDIDATE', 'PROJECT_MANAGER'),
  validateParams(validateApplicationParams),
  asyncHandler(interviewResultController.getResultByApplication),
);

module.exports = router;
