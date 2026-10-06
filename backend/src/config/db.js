const mongoose = require('mongoose');
const dns = require('dns');

// Fix Windows / ISP querySrv ECONNREFUSED by setting public DNS resolvers on Windows
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore fallback
  }
}

const maskCredentials = (msg) => {
  if (!msg || typeof msg !== 'string') return msg;
  return msg.replace(/\/\/[^@]+@/, '//***:***@');
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

    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {}
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

// Cache connection across serverless function invocations (Vercel)
let cachedPromise = null;

const connectDB = async () => {
  // If already connected, reuse existing active connection immediately
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is in-flight, await the same promise
  if (cachedPromise) {
    return cachedPromise;
  }

  cachedPromise = (async () => {
    const useMemoryDb = String(process.env.USE_MEMORY_DB).toLowerCase() === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. In-Memory Database Mode: ONLY used when explicitly requested via USE_MEMORY_DB=true
    if (useMemoryDb) {
      if (isProduction) {
        throw new Error('[Database] Critical Error: USE_MEMORY_DB cannot be used in production.');
      }
      console.log('[Database] USE_MEMORY_DB=true: Initializing in-memory MongoDB for local development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const inMemoryUri = mongod.getUri();
        const conn = await mongoose.connect(inMemoryUri, {
          dbName: 'preschool_management',
        });
        console.log('[Database] Connected to In-Memory MongoDB for local development.');
        return conn;
      } catch (err) {
        console.error('[Database] Critical: Could not connect to in-memory database:', maskCredentials(err.message));
        throw err;
      }
    }

    // 2. MongoDB Atlas / Standard Connection (Default)
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

    if (!mongoUri || mongoUri.trim() === '') {
      console.error('[Database] Critical Error: MONGODB_URI is not set in environment variables.');
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    try {
      mongoose.set('strictQuery', false);

      let conn;
      try {
        conn = await mongoose.connect(mongoUri, {
          dbName: 'preschool_management',
          authSource: 'admin',
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 15000,
        });
      } catch (initialErr) {
        if (
          (initialErr.message.includes('querySrv') || initialErr.message.includes('ECONNREFUSED')) &&
          typeof mongoUri === 'string' &&
          mongoUri.startsWith('mongodb+srv://')
        ) {
          console.warn('[Database] SRV DNS resolution failed on local network. Attempting direct shard connection fallback...');
          const directUri = await resolveDirectAtlasUri(mongoUri);
          if (directUri) {
            conn = await mongoose.connect(directUri, {
              dbName: 'preschool_management',
              authSource: 'admin',
              serverSelectionTimeoutMS: 10000,
              connectTimeoutMS: 15000,
            });
          } else {
            throw initialErr;
          }
        } else {
          throw initialErr;
        }
      }

      // Verify active database connectivity with admin ping
      await conn.connection.db.admin().ping();

      const isAtlas =
        conn.connection.host.includes('mongodb.net') ||
        (typeof mongoUri === 'string' && mongoUri.startsWith('mongodb+srv://'));

      if (isAtlas) {
        console.log('[Database] Connected to MongoDB Atlas');
      } else {
        console.log(`[Database] Connected to MongoDB (${conn.connection.host})`);
      }

      // Ensure seed data exists idempotently (safe for Vercel serverless where startServer is not called)
      try {
        const runSeed = require('../seeds/seedFunction');
        runSeed().catch((seedErr) => {
          console.warn('[Database Seed] Non-fatal seed check notice:', seedErr.message);
        });
      } catch (e) {}

      return conn;
    } catch (err) {
      const safeMsg = maskCredentials(err.message);
      console.error(`[Database] Connection failed: ${safeMsg}`);
      if (err.name === 'MongooseServerSelectionError' || err.message.includes('Could not connect to any servers')) {
        console.error('[Database] Action required: MongoDB Atlas rejected the connection. This happens when the current client IP address is not whitelisted in Atlas Network Access. In MongoDB Atlas, go to "Network Access" -> click "Add IP Address" -> choose "Allow Access from Anywhere" (0.0.0.0/0).');
      } else if (err.message.includes('auth') || err.message.includes('authentication failed')) {
        console.error('[Database] Action required: MongoDB Atlas rejected the credentials for your database user. Please verify or reset your database user password in MongoDB Atlas -> Database Access -> Edit Password, and update backend/.env.');
      }
      throw err;
    }
  })();

  try {
    const conn = await cachedPromise;
    return conn;
  } catch (err) {
    cachedPromise = null; // Reset cache so subsequent requests can retry
    throw err;
  }
};

module.exports = connectDB;

