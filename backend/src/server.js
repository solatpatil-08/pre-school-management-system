const path = require('path');
// 1. Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');
const validateConfig = require('./config/validateConfig');
const runSeed = require('./seeds/seedFunction');

// Startup order:
// Load environment variables
// → validate configuration
// → connect to MongoDB Atlas
// → verify connection
// → safely seed development data
// → start Express
const startServer = async () => {
  try {
    // 2. Validate configuration
    const config = validateConfig();

    // 3. Connect to MongoDB Atlas & verify connection
    await connectDB();

    // 4. Safely seed development data (idempotent)
    await runSeed();

    // 5. Start Express API server
    const server = app.listen(config.port, () => {
      console.log(`[Server] Pre-School Management API running on PORT: ${config.port}`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Server Error] Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`[Server Error] Startup failed:`, error.message);
    process.exit(1);
  }
};

// In standalone / local environment, start HTTP listener
if (require.main === module || !process.env.VERCEL) {
  startServer();
}

module.exports = app;
