const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const config = require('../utils/config');
const AppError = require('../utils/appError');
const { formatUser } = require('../utils/formatters');
const logger = require('../utils/logger');

function createToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

async function registerUser(data) {
  const password_hash = await bcrypt.hash(data.password, 10);

  let user;

  try {
    user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash,
        role: data.role,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      logger.warn('register_failed', {
        email: data.email,
        reason: 'email_already_registered',
      });

      throw new AppError('Email is already registered', 409);
    }

    throw err;
  }

  logger.action('register_success', {
    user_id: user.user_id,
    role: user.role,
    email: user.email,
  });

  return {
    user: formatUser(user),
    token: createToken(user),
  };
}

async function loginUser(data) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    logger.warn('login_failed', {
      email: data.email,
      reason: 'user_not_found',
    });

    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

  if (!isPasswordValid) {
    logger.warn('login_failed', {
      email: data.email,
      user_id: user.user_id,
      reason: 'invalid_password',
    });

    throw new AppError('Invalid email or password', 401);
  }

  logger.action('login_success', {
    user_id: user.user_id,
    role: user.role,
  });

  return {
    user: formatUser(user),
    token: createToken(user),
  };
}

function getCurrentUser(user) {
  return formatUser(user);
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
