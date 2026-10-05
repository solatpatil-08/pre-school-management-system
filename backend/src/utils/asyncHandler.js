/**
 * Express async handler utility
 * Wraps async route handlers and forwards any unhandled rejected promise to next()
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
