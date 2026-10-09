const seedData = require('./seed');
const User = require('../models/User');

/**
 * runSeed - invoked automatically by server.js on startup or by db.js.
 * Ensures the comprehensive Indian preschool demo dataset is seeded if not present.
 */
const runSeed = async () => {
  try {
    const indianAdmin = await User.findOne({ email: 'admin@preschool.demo' });
    if (indianAdmin) {
      console.log('[Seed] Indian preschool demo data already initialized and ready.');
      return true;
    }

    console.log('[Seed] Database requires Indian demo data initialization. Running seedData()...');
    return await seedData();
  } catch (error) {
    console.error('[Seed Error]:', error.message || error);
    // Don't crash server if seed encounters an issue during startup
    return false;
  }
};

module.exports = runSeed;
