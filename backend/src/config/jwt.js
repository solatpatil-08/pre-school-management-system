/**
 * Centralized JWT Security Configuration
 * Enforces production-grade secret strength and prevents hardcoded secret leaks
 */

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.length < 32 || secret.includes('replace_with') || secret.includes('supersecret_preschool')) {
      throw new Error(
        '[Security Alert] FATAL: Production environment requires a strong JWT_SECRET of at least 32 characters.'
      );
    }
    return secret;
  }

  // Development/Test fallback with warning
  if (!secret) {
    console.warn(
      '[Security Warning] JWT_SECRET is not set in environment. Falling back to temporary local development key.'
    );
    return 'dev_temporary_insecure_jwt_secret_key_minimum_32_chars_2026';
  }

  return secret;
};

const getJwtExpiresIn = () => {
  return process.env.JWT_EXPIRE || '7d';
};

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
};
