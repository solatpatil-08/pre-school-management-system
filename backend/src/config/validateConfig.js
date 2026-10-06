/**
 * Pre-School Management System - Environment Configuration Validator
 * Validates environment variables before starting database or API services.
 */
const validateConfig = () => {
  const port = parseInt(process.env.PORT, 10) || 5000;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const useMemoryDb = String(process.env.USE_MEMORY_DB).toLowerCase() === 'true';
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

  if (!process.env.JWT_SECRET) {
    console.warn('[Config Warning] JWT_SECRET is not set in environment variables. Using default development secret.');
  }

  // When not using in-memory DB, MONGODB_URI must be provided and valid
  if (!useMemoryDb) {
    if (!mongoUri || mongoUri.trim() === '') {
      throw new Error(
        'MONGODB_URI is missing from environment variables. Please configure your MongoDB Atlas connection string.'
      );
    }

    // Check if the URI still contains template placeholders
    const placeholderPatterns = [
      '<I WILL ENTER',
      '<password>',
      '<db_password>',
      '<db_user>',
      '<PASTE_',
      '<your-cluster>',
      '<cluster-host>',
    ];

    const hasPlaceholder = placeholderPatterns.some((pattern) =>
      mongoUri.includes(pattern)
    );

    if (hasPlaceholder) {
      throw new Error(
        "MONGODB_URI contains a placeholder. Please replace placeholder tokens with your actual MongoDB Atlas connection string (including your real password)."
      );
    }
  }

  return {
    port,
    nodeEnv,
    useMemoryDb,
    mongoUri,
  };
};

module.exports = validateConfig;
