const rateLimit = require('express-rate-limit');

// ─── General API rate limiter ──────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in a few minutes.',
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

// ─── Strict AI endpoint limiter (Gemini calls) ────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'You\'ve reached the AI request limit. Please wait 15 minutes before trying again.',
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

// ─── Auth rate limiter (prevent brute force) ──────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true,
});

module.exports = { generalLimiter, aiLimiter, authLimiter };
