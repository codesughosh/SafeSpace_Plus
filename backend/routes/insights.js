const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getWordCloud,
  getRecommendations,
  getWeeklyReport,
} = require('../controllers/insightsController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// All insights routes require authentication
router.use(protect);

router.get('/dashboard', getDashboardData);
router.get('/wordcloud', getWordCloud);

// AI endpoints — rate limited
router.post('/recommendations', aiLimiter, getRecommendations);
router.post('/weekly-report', aiLimiter, getWeeklyReport);

module.exports = router;
