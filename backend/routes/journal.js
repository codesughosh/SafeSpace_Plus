const express = require('express');
const router = express.Router();
const {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  deleteJournal,
  analyzeJournal,
} = require('../controllers/journalController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// All journal routes require authentication
router.use(protect);

router.get('/', getJournals);
router.post('/', createJournal);
router.get('/:id', getJournal);
router.put('/:id', updateJournal);
router.delete('/:id', deleteJournal);

// AI analysis endpoint — rate limited
router.post('/:id/analyze', aiLimiter, analyzeJournal);

module.exports = router;
