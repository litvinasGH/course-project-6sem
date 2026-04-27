const express = require('express');
const applicationController = require('../controllers/applicationController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateParams } = require('../middleware/validationMiddleware');
const { validateVacancyParams } = require('../utils/validators');

const router = express.Router();

router.post(
  '/:vacancyId/applications',
  authenticate,
  authorizeRoles('CANDIDATE'),
  validateParams(validateVacancyParams),
  asyncHandler(applicationController.applyToVacancy),
);

module.exports = router;
