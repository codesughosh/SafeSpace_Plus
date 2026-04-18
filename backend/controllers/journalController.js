const Journal = require('../models/Journal');
const MoodLog = require('../models/MoodLog');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { analyzeJournalEntry } = require('../services/sentimentService');

// ─── GET /api/journal — paginated list ────────────────────────────────────────
const getJournals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [journals, total] = await Promise.all([
    Journal.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content'), // Exclude full content in list view
    Journal.countDocuments({ userId: req.user._id }),
  ]);

  res.json({
    success: true,
    journals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// ─── GET /api/journal/:id ──────────────────────────────────────────────────────
const getJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!journal) {
    return res.status(404).json({ success: false, message: 'Journal entry not found.' });
  }

  res.json({ success: true, journal });
});

// ─── POST /api/journal ─────────────────────────────────────────────────────────
const createJournal = asyncHandler(async (req, res) => {
  const { title, content, emotionTags, moodScore, inputMethod } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: 'Journal content is required.' });
  }

  const journal = await Journal.create({
    userId: req.user._id,
    title: title || '',
    content,
    emotionTags: emotionTags || [],
    moodScore,
    inputMethod: inputMethod || 'text',
  });

  // Update user streak
  const user = await User.findById(req.user._id);
  user.updateStreak();
  await user.save();

  // Log mood from journal entry
  if (moodScore) {
    await MoodLog.create({
      userId: req.user._id,
      score: moodScore,
      note: title || 'From journal entry',
      source: 'journal',
      date: new Date(),
    });
  }

  res.status(201).json({ success: true, journal });
});

// ─── PUT /api/journal/:id ──────────────────────────────────────────────────────
const updateJournal = asyncHandler(async (req, res) => {
  const { title, content, emotionTags, moodScore } = req.body;

  const journal = await Journal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { title, content, emotionTags, moodScore },
    { new: true, runValidators: true }
  );

  if (!journal) {
    return res.status(404).json({ success: false, message: 'Journal entry not found.' });
  }

  res.json({ success: true, journal });
});

// ─── DELETE /api/journal/:id ───────────────────────────────────────────────────
const deleteJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!journal) {
    return res.status(404).json({ success: false, message: 'Journal entry not found.' });
  }

  res.json({ success: true, message: 'Journal entry deleted.' });
});

// ─── POST /api/journal/:id/analyze — trigger Gemini sentiment analysis ─────────
const analyzeJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!journal) {
    return res.status(404).json({ success: false, message: 'Journal entry not found.' });
  }

  if (!journal.content?.trim()) {
    return res.status(400).json({ success: false, message: 'Journal has no content to analyze.' });
  }

  const user = await User.findById(req.user._id).select('persona');
  const analysis = await analyzeJournalEntry(journal.content, user.persona || 'general');

  // Save analysis to journal
  journal.analysis = analysis;
  await journal.save();

  res.json({ success: true, analysis, journal });
});

module.exports = {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  deleteJournal,
  analyzeJournal,
};
