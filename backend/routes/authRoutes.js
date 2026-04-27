const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');
const {
  validateRegisterBody,
  validateLoginBody,
} = require('../utils/validators');

const router = express.Router();

router.post(
  '/register',
  validateBody(validateRegisterBody),
  asyncHandler(authController.register),
);

router.post(
  '/login',
  validateBody(validateLoginBody),
  asyncHandler(authController.login),
);

router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;
