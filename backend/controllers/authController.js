const authService = require('../services/authService');

async function register(req, res) {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
}

async function login(req, res) {
  const result = await authService.loginUser(req.body);
  res.json(result);
}

async function me(req, res) {
  res.json({ user: authService.getCurrentUser(req.user) });
}

module.exports = {
  register,
  login,
  me,
};
