const jwt = require('jsonwebtoken');
const prisma = require('../db');
const config = require('../utils/config');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    throw new AppError('Authentication token is required', 401);
  }

  let payload;

  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { user_id: Number(payload.user_id) },
  });

  if (!user) {
    throw new AppError('User not found', 401);
  }

  req.auth = {
    user_id: user.user_id,
    role: user.role,
  };
  req.user = user;

  next();
});

module.exports = {
  authenticate,
};
