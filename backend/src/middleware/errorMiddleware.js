const ApiError = require('../utils/apiError');

/**
 * 404 Route Not Found Middleware
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route Not Found - ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Centralized Global Error Handler Middleware
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload provided in request body.';
  }

  // Handle Mongoose CastError (Bad ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = process.env.NODE_ENV === 'production' 
      ? 'Resource not found with the requested identifier.'
      : `Resource not found with invalid ID: ${err.value}`;
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate key entered: '${field || 'field'}' with value '${err.keyValue ? err.keyValue[field] : ''}' already exists.`;
  }

  // Handle Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((val) => val.message);
    message = errors.join(', ');
  }

  // Handle JWT invalid signature
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Authorization denied.';
  }

  // Handle JWT expiration
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please log in again.';
  }

  // Log 500 errors so they appear in Vercel runtime logs for debugging
  if (statusCode >= 500) {
    console.error(`[API 500 Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // Mask internal 500 errors in production response body to avoid leaking server internals
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected internal server error occurred.';
  }

  // Ensure passwords or sensitive credentials are never leaked
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
