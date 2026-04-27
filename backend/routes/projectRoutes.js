const express = require('express');
const projectController = require('../controllers/projectController');
const vacancyController = require('../controllers/vacancyController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateParams } = require('../middleware/validationMiddleware');
const {
  validateProjectBody,
  validateVacancyBody,
  validateProjectParams,
} = require('../utils/validators');

const router = express.Router();

router.get(
  '/',
  authenticate,
  asyncHandler(projectController.getProjects),
);

router.post(
  '/',
  authenticate,
  authorizeRoles('PROJECT_MANAGER'),
  validateBody(validateProjectBody),
  asyncHandler(projectController.createProject),
);

router.get(
  '/:projectId/vacancies',
  authenticate,
  validateParams(validateProjectParams),
  asyncHandler(vacancyController.getProjectVacancies),
);

router.post(
  '/:projectId/vacancies',
  authenticate,
  authorizeRoles('PROJECT_MANAGER'),
  validateParams(validateProjectParams),
  validateBody(validateVacancyBody),
  asyncHandler(vacancyController.createVacancy),
);

module.exports = router;
