const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');

// ─── Helmet: sets secure HTTP headers ────────────────────────────────────────
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // allow GCS signed URL downloads
});

// ─── HPP: prevent HTTP Parameter Pollution ───────────────────────────────────
const hppMiddleware = hpp();

// ─── General API rate limiter (all routes) ───────────────────────────────────
// 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,     // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests. Please slow down and try again later.' },
  skip: (req) => req.method === 'OPTIONS', // skip preflight requests
});

// ─── Strict limiter for auth routes ──────────────────────────────────────────
// 10 login attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ─── Upload limiter ───────────────────────────────────────────────────────────
// 20 uploads per hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached. You can upload up to 20 files per hour.' },
});

// ─── Share link creation limiter ─────────────────────────────────────────────
// 30 share links per hour per IP
const shareLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Share link limit reached. Maximum 30 share links per hour.' },
});

// ─── Download limiter (public share downloads) ───────────────────────────────
// 50 downloads per hour per IP
const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Download limit reached. Maximum 50 downloads per hour.' },
});

// ─── Input sanitization helper ────────────────────────────────────────────────
function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return 'unnamed';
  return name
    .replace(/[^a-zA-Z0-9._\-\s]/g, '') // strip dangerous chars
    .replace(/\.\./g, '')                 // prevent path traversal
    .trim()
    .substring(0, 255);                   // cap filename length
}

// ─── Validate file type (MIME whitelist) ─────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/gzip', 'application/x-tar',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/html', 'text/markdown',
  'application/json',
]);

function validateMimeType(mimeType) {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

module.exports = {
  helmetMiddleware,
  hppMiddleware,
  generalLimiter,
  authLimiter,
  uploadLimiter,
  shareLimiter,
  downloadLimiter,
  sanitizeFilename,
  validateMimeType,
};