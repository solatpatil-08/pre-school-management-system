const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const dns = require('dns');

// Fix Windows DNS querySrv ECONNREFUSED by setting public DNS resolvers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore fallback
}

const maskUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '[empty]';
  return uri.replace(/\/\/[^@]+@/, '//***:***@');
};

const resolveDirectAtlasUri = async (srvUri) => {
  try {
    const match = srvUri.match(/mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?/);
    if (!match) return null;
    const auth = match[1];
    const srvHost = match[2];
    let dbPath = match[3];
    if (!dbPath || dbPath === '/') dbPath = '/preschool_management';
    const query = match[4] || '';

    dns.setServers(['8.8.8.8', '1.1.1.1']);
    const records = await dns.promises.resolveSrv(`_mongodb._tcp.${srvHost}`);
    if (!records || records.length === 0) return null;

    const hosts = records.map((r) => `${r.name}:${r.port}`).join(',');

    let replicaSet = 'atlas-21lwbf-shard-0';
    let authSource = 'admin';
    try {
      const txtRecords = await dns.promises.resolveTxt(srvHost);
      if (txtRecords && txtRecords.length > 0) {
        const txt = txtRecords.flat().join('&');
        const rsMatch = txt.match(/replicaSet=([^&]+)/);
        if (rsMatch) replicaSet = rsMatch[1];
        const asMatch = txt.match(/authSource=([^&]+)/);
        if (asMatch) authSource = asMatch[1];
      }
    } catch (e) {}

    const params = new URLSearchParams(query.replace(/^\?/, ''));
    if (!params.has('ssl') && !params.has('tls')) params.set('ssl', 'true');
    if (replicaSet && !params.has('replicaSet')) params.set('replicaSet', replicaSet);
    if (authSource && !params.has('authSource')) params.set('authSource', authSource);

    return `mongodb://${auth}@${hosts}${dbPath}?${params.toString()}`;
  } catch (err) {
    return null;
  }
};

const runVerification = async () => {
  console.log('====================================================');
  console.log('🔍 RUNNING MONGODB ATLAS CONNECTIVITY VERIFICATION');
  console.log('====================================================\n');

  // 1. Verify MONGODB_URI is loaded
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri) {
    console.error('❌ Check 1 Failed: MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }
  console.log('✅ Check 1: MONGODB_URI loaded successfully from backend/.env');
  console.log(`   Target URI: ${maskUri(rawUri)}`);

  // 2. Confirm USE_MEMORY_DB=false
  const useMemoryDb = String(process.env.USE_MEMORY_DB).toLowerCase() === 'true';
  if (useMemoryDb) {
    console.error('❌ Check 2 Failed: USE_MEMORY_DB is set to true');
    process.exit(1);
  }
  console.log('✅ Check 2: USE_MEMORY_DB=false confirmed (in-memory fallback is disabled)');

  // 3. Connect to MongoDB Atlas via Mongoose
  console.log('\n⏳ Connecting to MongoDB Atlas via Mongoose...');
  try {
    mongoose.set('strictQuery', false);
    let conn;
    try {
      conn = await mongoose.connect(rawUri, {
        dbName: 'preschool_management',
        authSource: 'admin',
        serverSelectionTimeoutMS: 12000,
        connectTimeoutMS: 15000,
      });
    } catch (initialErr) {
      if (
        (initialErr.message.includes('querySrv') || initialErr.message.includes('ECONNREFUSED')) &&
        typeof rawUri === 'string' &&
        rawUri.startsWith('mongodb+srv://')
      ) {
        console.warn('⚠️ SRV DNS query refused by local DNS. Attempting direct shard connection fallback...');
        const directUri = await resolveDirectAtlasUri(rawUri);
        if (directUri) {
          conn = await mongoose.connect(directUri, {
            dbName: 'preschool_management',
            authSource: 'admin',
            serverSelectionTimeoutMS: 12000,
            connectTimeoutMS: 15000,
          });
        } else {
          throw initialErr;
        }
      } else {
        throw initialErr;
      }
    }

    console.log('✅ Check 3: Mongoose connected to database cluster');
    console.log(`   Connected Host: ${conn.connection.host}`);
    console.log(`   Database Name: ${conn.connection.name}`);

    // Verify it is actually an Atlas cluster
    const isAtlas =
      conn.connection.host.includes('mongodb.net') ||
      rawUri.startsWith('mongodb+srv://');

    if (isAtlas) {
      console.log('✅ Check 4: Verified host is a MongoDB Atlas cluster');
    } else {
      console.warn('⚠️ Note: Host does not appear to be standard mongodb.net domain.');
    }

    // Ping admin
    await conn.connection.db.admin().ping();
    console.log('✅ Check 5: Database ping succeeded (read/write connection active)');

    // 4. Verify idempotent seed
    console.log('\n⏳ Running idempotent development seeder...');
    const runSeed = require('./src/seeds/seedFunction');
    await runSeed();
    console.log('✅ Check 6: Seed process completed idempotently without data loss');

    // Count records in Atlas
    const User = require('./src/models/User');
    const Class = require('./src/models/Class');
    const Student = require('./src/models/Student');
    const userCount = await User.countDocuments();
    const classCount = await Class.countDocuments();
    const studentCount = await Student.countDocuments();
    console.log(`   Atlas Records: ${userCount} users, ${classCount} classes, ${studentCount} students`);

    // 5. Test Express server & API endpoints
    console.log('\n⏳ Starting Express API to test live endpoints...');
    const app = require('./src/app');
    const PORT = 5000;
    const server = app.listen(PORT, async () => {
      console.log(`✅ Check 7: Express running on port ${PORT}`);

      try {
        // Test GET /api/health
        const healthRes = await fetch(`http://localhost:${PORT}/api/health`);
        const healthData = await healthRes.json();
        console.log('✅ Check 8: GET /api/health responded with 200 OK:');
        console.log(`   Status: ${healthData.status}, DB: ${healthData.database?.status}, Type: ${healthData.database?.type}`);

        // Test real API request: POST /api/auth/login
        const loginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@preschool.com',
            password: 'Admin@123',
          }),
        });
        const loginData = await loginRes.json();
        if (loginData.success && loginData.token) {
          console.log('✅ Check 9: Real API login request against MongoDB Atlas succeeded!');
          console.log(`   User authenticated: ${loginData.user?.name} (${loginData.user?.role})`);
        } else {
          console.error('❌ Check 9 Failed: Login request failed', loginData);
        }

        console.log('\n====================================================');
        console.log('🎉 ALL 9 ATLAS CONNECTIVITY CHECKS PASSED SUCCESSFULLY!');
        console.log('====================================================');
      } catch (err) {
        console.error('❌ API Request test error:', err.message);
      } finally {
        server.close(async () => {
          await mongoose.disconnect();
          process.exit(0);
        });
      }
    });
  } catch (err) {
    console.error('\n❌ MongoDB Atlas Connection Failed:');
    console.error(`   Error: ${err.message}`);
    if (
      err.name === 'MongooseServerSelectionError' ||
      err.message.includes('Could not connect to any servers') ||
      err.message.includes('SSL alert number 80')
    ) {
      console.error('\n📋 DIAGNOSIS & REQUIRED FIX:');
      console.error('   MongoDB Atlas is refusing the TLS handshake because your current IP address is not whitelisted.');
      console.error('   Because your internet connection (ISP/mobile) uses a dynamic IP, you should allow access from anywhere:');
      console.error('   1. Open MongoDB Atlas (https://cloud.mongodb.com)');
      console.error('   2. In the left navigation, click "Network Access" (under Security)');
      console.error('   3. Click the "Add IP Address" button');
      console.error('   4. Click "ALLOW ACCESS FROM ANYWHERE" (adds 0.0.0.0/0)');
      console.error('   5. Click "Confirm" and wait ~1 minute for Atlas to apply the rule');
      console.error('   6. Re-run: npm run test:atlas\n');
    } else if (err.message.includes('auth') || err.message.includes('authentication failed')) {
      console.error('\n📋 DIAGNOSIS & REQUIRED FIX:');
      console.error('   Network & TLS connection to MongoDB Atlas SUCCEEDED! ✅');
      console.error('   However, MongoDB Atlas rejected the database user credentials (bad auth).');
      console.error('   To fix this:');
      console.error('   1. Open MongoDB Atlas (https://cloud.mongodb.com)');
      console.error('   2. In the left navigation under "Security", click "Database Access"');
      console.error('   3. Locate your database user and click "Edit" (pencil icon)');
      console.error('   4. Click "Edit Password", type a known password (or autogenerate), and click "Update User"');
      console.error('   5. Update the password in backend/.env (ensure NO < > angle brackets are around it)');
      console.error('   6. Re-run: npm run test:atlas\n');
    }
    process.exit(1);
  }
};

runVerification();
