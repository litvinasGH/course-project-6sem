const express = require('express');
const applicationController = require('../controllers/applicationController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateParams } = require('../middleware/validationMiddleware');
const {
  validateApplicationDecisionBody,
  validateApplicationParams,
} = require('../utils/validators');

const router = express.Router();

router.get(
  '/my',
  authenticate,
  authorizeRoles('CANDIDATE'),
  asyncHandler(applicationController.getMyApplications),
);

router.put(
  '/:applicationId/decision',
  authenticate,
  authorizeRoles('PROJECT_MANAGER'),
  validateParams(validateApplicationParams),
  validateBody(validateApplicationDecisionBody),
  asyncHandler(applicationController.makeDecision),
);

module.exports = router;
