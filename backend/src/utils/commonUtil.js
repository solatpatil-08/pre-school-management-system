/**
 * Reusable backend utility helpers for pagination, text parsing, and query construction
 */

/**
 * Parses pagination parameters safely with min/max boundary constraints
 * @param {Object} query - Express req.query
 * @param {number} defaultLimit - Default page limit (default: 10)
 * @param {number} maxLimit - Upper limit ceiling (default: 100)
 */
const parsePagination = (query = {}, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(maxLimit, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    calculateTotalPages: (total) => Math.ceil(total / limit) || 1,
  };
};

/**
 * Parses a single full name string into separate firstName and lastName
 * @param {string} fullName
 * @param {string} fallbackFirst
 * @param {string} fallbackLast
 */
const splitFullName = (fullName = '', fallbackFirst = 'User', fallbackLast = '') => {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: fallbackFirst, lastName: fallbackLast };
  }

  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || fallbackFirst;
  const lastName = parts.slice(1).join(' ') || fallbackLast;

  return { firstName, lastName };
};

/**
 * Escapes special characters for safe regular expression querying
 * Prevents regex injection and syntax errors from user search inputs
 * @param {string} text
 */
const escapeRegex = (text = '') => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/**
 * Creates a case-insensitive safe regex query object
 * @param {string} text
 */
const createSafeSearchRegex = (text = '') => {
  const escaped = escapeRegex(text.trim());
  return escaped ? { $regex: escaped, $options: 'i' } : null;
};

module.exports = {
  parsePagination,
  splitFullName,
  escapeRegex,
  createSafeSearchRegex,
};
