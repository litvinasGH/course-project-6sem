const AppError = require('../utils/appError');

function validateBody(validator) {
  return (req, res, next) => {
    const { errors, value } = validator(req.body || {});

    if (errors.length > 0) {
      return next(new AppError('Validation failed', 400, errors));
    }

    req.body = value;
    next();
  };
}

function validateParams(validator) {
  return (req, res, next) => {
    const { errors, value } = validator(req.params || {});

    if (errors.length > 0) {
      return next(new AppError('Validation failed', 400, errors));
    }

    req.params = { ...req.params, ...value };
    next();
  };
}

module.exports = {
  validateBody,
  validateParams,
};
