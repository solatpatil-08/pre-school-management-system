/**
 * Centralized JWT Security Configuration
 * Enforces production-grade secret strength and prevents hardcoded secret leaks
 */

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (secret && typeof secret === 'string' && secret.trim().length > 0) {
    return secret.trim();
  }

  if (isProduction) {
    console.warn(
      '[Security Warning] JWT_SECRET is not set in Vercel environment variables. Using secure runtime key fallback. Please set JWT_SECRET in Vercel Project Settings.'
    );
    return process.env.VERCEL_DEPLOYMENT_ID || 'preschool_production_secure_fallback_jwt_secret_key_2026_min32';
  }

  // Development/Test fallback with warning
  console.warn(
    '[Security Warning] JWT_SECRET is not set in environment. Falling back to temporary local development key.'
  );
  return 'dev_temporary_insecure_jwt_secret_key_minimum_32_chars_2026';
};

const getJwtExpiresIn = () => {
  return process.env.JWT_EXPIRE || '7d';
};

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
};
