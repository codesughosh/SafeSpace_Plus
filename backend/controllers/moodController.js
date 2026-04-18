const MoodLog = require('../models/MoodLog');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── GET /api/mood?days=30 — mood history ─────────────────────────────────────
const getMoodHistory = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await MoodLog.find({
    userId: req.user._id,
    date: { $gte: startDate },
  }).sort({ date: 1 });

  res.json({ success: true, logs });
});

// ─── POST /api/mood — manual mood log ─────────────────────────────────────────
const logMood = asyncHandler(async (req, res) => {
  const { score, note, source } = req.body;

  if (!score || score < 1 || score > 10) {
    return res.status(400).json({
      success: false,
      message: 'Mood score must be between 1 and 10.',
    });
  }

  // Prevent duplicate manual logs for the same day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  if (source === 'manual' || !source) {
    const existing = await MoodLog.findOne({
      userId: req.user._id,
      source: 'manual',
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (existing) {
      // Update existing manual log
      existing.score = score;
      existing.note = note || existing.note;
      await existing.save();
      return res.json({ success: true, log: existing, updated: true });
    }
  }

  const log = await MoodLog.create({
    userId: req.user._id,
    score,
    note: note || '',
    source: source || 'manual',
    date: new Date(),
  });

  res.status(201).json({ success: true, log });
});

module.exports = { getMoodHistory, logMood };
