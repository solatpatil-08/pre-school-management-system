const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('./middleware/mongoSanitize');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const parentRoutes = require('./routes/parentRoutes');
const classRoutes = require('./routes/classRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const feeRoutes = require('./routes/feeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const eventRoutes = require('./routes/eventRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const settingRoutes = require('./routes/settingRoutes');

const app = express();

// Disable information disclosure headers
app.disable('x-powered-by');

// Enhanced HTTP Security Headers via Helmet
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Additional Defensive HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Robust Production CORS Configuration
const parseOrigins = () => {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];
  if (process.env.CLIENT_URL) {
    const custom = process.env.CLIENT_URL.split(',')
      .map((url) => url.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    defaults.push(...custom);
  }
  return defaults;
};

const allowedOrigins = parseOrigins();

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile clients, local scripts, Postman)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '');
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        process.env.NODE_ENV !== 'production' ||
        (process.env.CLIENT_URL && process.env.CLIENT_URL.includes('.vercel.app') && normalizedOrigin.endsWith('.vercel.app'));

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`Blocked by CORS policy: ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400, // 24 hours preflight cache
  })
);

// Body Parsers with payload size limits to mitigate payload DOS
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// NoSQL / MongoDB Operator Injection Defense
app.use(mongoSanitize);

// Rate Limiting
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Request Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const isDbConnected = mongoose.connection.readyState === 1;
  const dbHost = mongoose.connection.host || '';
  const isAtlas =
    dbHost.includes('mongodb.net') ||
    (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://'));

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'Pre-School Management System API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: isDbConnected ? 'connected' : 'disconnected',
      type: isAtlas ? 'MongoDB Atlas' : (process.env.USE_MEMORY_DB === 'true' ? 'In-Memory' : 'MongoDB'),
      name: mongoose.connection.name || 'preschool_management',
    },
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
