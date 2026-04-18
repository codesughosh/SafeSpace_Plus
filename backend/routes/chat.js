const express = require('express');
const router = express.Router();
const {
  getSessions,
  getSession,
  createSession,
  sendMessage,
  summarizeSession,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// All chat routes require authentication
router.use(protect);

router.get('/sessions', getSessions);
router.post('/session', createSession);
router.get('/sessions/:id', getSession);

// AI endpoints — rate limited
router.post('/message', aiLimiter, sendMessage);
router.post('/session/:id/summarize', aiLimiter, summarizeSession);

module.exports = router;
