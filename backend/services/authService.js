const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const config = require('../utils/config');
const AppError = require('../utils/appError');
const { formatUser } = require('../utils/formatters');

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
      throw new AppError('Email is already registered', 409);
    }

    throw err;
  }

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
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

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
