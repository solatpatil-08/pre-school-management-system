/**
 * NoSQL Injection Protection Middleware
 * Recursively cleans user input from req.body, req.query, and req.params
 * Neutralizes keys starting with '$' or containing '.' to prevent MongoDB operator injection
 */

const sanitizeObject = (target) => {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeObject(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(target)) {
    // If key starts with $ (MongoDB query selector operator) or contains '.', sanitize or omit
    if (key.startsWith('$') || key.includes('.')) {
      continue; // Strip injection operator key
    }

    if (value && typeof value === 'object') {
      cleaned[key] = sanitizeObject(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

const mongoSanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = mongoSanitize;
