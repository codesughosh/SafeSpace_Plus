const express = require('express');
const router = express.Router();
const { getMoodHistory, logMood } = require('../controllers/moodController');
const { protect } = require('../middleware/auth');

// All mood routes require authentication
router.use(protect);

router.get('/', getMoodHistory);
router.post('/', logMood);

module.exports = router;
