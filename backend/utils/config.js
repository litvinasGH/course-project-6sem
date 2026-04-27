require('dotenv/config');

const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required');
}

module.exports = config;
