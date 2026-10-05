const ApiError = require('../utils/apiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl} - Endpoint does not exist`));
};

module.exports = notFound;
