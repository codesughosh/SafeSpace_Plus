const express = require('express');
const router = express.Router();
const {
  completeOnboarding,
  updateProfile,
  updatePreferences,
  exportData,
  deleteAllData,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All user routes require authentication
router.use(protect);

router.post('/onboarding', completeOnboarding);
router.put('/profile', updateProfile);
router.put('/preferences', updatePreferences);
router.get('/export', exportData);
router.delete('/data', deleteAllData);

module.exports = router;
