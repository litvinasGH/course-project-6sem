const express = require('express');
const applicationController = require('../controllers/applicationController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
  '/my',
  authenticate,
  authorizeRoles('CANDIDATE'),
  asyncHandler(applicationController.getMyApplications),
);

module.exports = router;
