require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { logger, requestLogger } = require('./config/logger');
const {
  helmetMiddleware,
  hppMiddleware,
  generalLimiter,
  authLimiter,
} = require('./middleware/security');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const shareRoutes = require('./routes/share');

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Trust proxy (needed for correct IP in rate limiting behind Cloud Run/LB) ─
app.set('trust proxy', 1);

// ─── Security headers (Helmet) ────────────────────────────────────────────────
app.use(helmetMiddleware);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsing (with size limits) ─────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));         // prevent huge JSON payloads
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── HTTP Parameter Pollution protection ─────────────────────────────────────
app.use(hppMiddleware);

// ─── Session ──────────────────────────────────────────────────────────────────
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  logger.error('SESSION_SECRET must be set and at least 32 characters long. Exiting.');
  process.exit(1);
}
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'clouddrive.sid', // don't use default 'connect.sid'
  cookie: {
    secure: IS_PROD,       // HTTPS only in production
    httpOnly: true,        // no JS access to cookie
    sameSite: IS_PROD ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── General rate limit on all API routes ────────────────────────────────────
app.use('/api/', generalLimiter);
app.use('/auth/', authLimiter);  // stricter limit on auth endpoints

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/share', shareRoutes);

// ─── Health check (no rate limit, no auth) ────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.originalUrl });

  // Never leak stack traces or internal details to the client
  const status = err.status || err.statusCode || 500;
  const message = IS_PROD && status === 500
    ? 'An internal error occurred'
    : err.message || 'Internal server error';

  res.status(status).json({ error: message });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 CloudDrive backend running on http://localhost:${PORT}`, {
    env: process.env.NODE_ENV || 'development',
  });
});