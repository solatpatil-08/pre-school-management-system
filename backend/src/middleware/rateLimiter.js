/**
 * In-Memory Sliding Window Rate Limiter Middleware
 * Protects against brute-force attacks, credential stuffing, and DoS
 */

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes default
  maxRequests = 100,          // 100 requests per window
  message = 'Too many requests from this IP address. Please try again later.',
} = {}) => {
  const ipRequests = new Map();

  // Periodically clean up stale records to prevent memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequests.entries()) {
      if (now - record.startTime > windowMs) {
        ipRequests.delete(ip);
      }
    }
  }, Math.max(windowMs, 60000)).unref(); // unref so it does not block node exit

  return (req, res, next) => {
    // In test environment, skip rate limiting so test suites run fast
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const current = ipRequests.get(ip);

    if (!current || now - current.startTime > windowMs) {
      ipRequests.set(ip, {
        startTime: now,
        count: 1,
      });

      res.setHeader('RateLimit-Limit', maxRequests);
      res.setHeader('RateLimit-Remaining', maxRequests - 1);
      res.setHeader('RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    current.count += 1;
    const remaining = Math.max(0, maxRequests - current.count);
    const resetTime = Math.ceil((current.startTime + windowMs) / 1000);

    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetTime);

    if (current.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((current.startTime + windowMs - now) / 1000));
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil((current.startTime + windowMs - now) / 1000),
      });
    }

    next();
  };
};

const isDev = process.env.NODE_ENV !== 'production';

// Specialized rate limiters
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: isDev ? 1000 : 50, // 1000 in development/test, 50 in production
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: isDev ? 5000 : 1000,
  message: 'API rate limit exceeded. Please throttle your requests.',
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
};
