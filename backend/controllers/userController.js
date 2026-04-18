const User = require('../models/User');
const Journal = require('../models/Journal');
const MoodLog = require('../models/MoodLog');
const ChatSession = require('../models/ChatSession');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── POST /api/user/onboarding — save intake + persona ───────────────────────
const completeOnboarding = asyncHandler(async (req, res) => {
  const { persona, responses, privacyConsent } = req.body;

  if (!privacyConsent) {
    return res.status(400).json({
      success: false,
      message: 'Privacy consent is required to continue.',
    });
  }

  if (!persona || !['student', 'professional', 'general'].includes(persona)) {
    return res.status(400).json({
      success: false,
      message: 'A valid persona selection is required.',
    });
  }

  // Compute initial wellness score from intake responses (1–5 scale)
  // Higher response values generally indicate better wellness (inverted for Q1/Q2)
  let wellnessScore = 50; // default midpoint
  if (Array.isArray(responses) && responses.length > 0) {
    const weights = [-10, -8, 6, 8, 0]; // Q1 hopeless (negative), Q2 stress (negative), Q3 sleep (positive), Q4 support (positive), Q5 neutral
    let total = 50;
    responses.forEach((r, i) => {
      if (r.answer && weights[i] !== undefined) {
        // Scale: answer 1–5, weight applies at extremes
        const normalized = (r.answer - 3); // -2 to +2
        total += normalized * weights[i];
      }
    });
    wellnessScore = Math.min(100, Math.max(0, Math.round(total)));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      persona,
      intakeAssessment: {
        responses: responses || [],
        initialWellnessScore: wellnessScore,
        completedAt: new Date(),
      },
      'preferences.onboardingComplete': true,
    },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, user, wellnessScore });
});

// ─── PUT /api/user/profile — update name/email/persona ───────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, persona } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (email) updates.email = email.toLowerCase();
  if (persona && ['student', 'professional', 'general'].includes(persona)) {
    updates.persona = persona;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, user });
});

// ─── PUT /api/user/preferences ────────────────────────────────────────────────
const updatePreferences = asyncHandler(async (req, res) => {
  const { allowPersonalization } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { 'preferences.allowPersonalization': allowPersonalization },
    { new: true }
  ).select('-password');

  res.json({ success: true, preferences: user.preferences });
});

// ─── GET /api/user/export — export all user data as JSON ─────────────────────
const exportData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, journals, moodLogs, chatSessions] = await Promise.all([
    User.findById(userId).select('-password'),
    Journal.find({ userId }).sort({ createdAt: -1 }),
    MoodLog.find({ userId }).sort({ date: -1 }),
    ChatSession.find({ userId }).sort({ createdAt: -1 }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      persona: user.persona,
      streak: user.streak,
      createdAt: user.createdAt,
    },
    intakeAssessment: user.intakeAssessment,
    journals,
    moodLogs,
    chatSessions: chatSessions.map((s) => ({
      title: s.title,
      messages: s.messages,
      sessionSentiment: s.sessionSentiment,
      distressScore: s.distressScore,
      createdAt: s.createdAt,
    })),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="safespace-plus-export-${Date.now()}.json"`);
  res.json(exportData);
});

// ─── DELETE /api/user/data — delete all user data ────────────────────────────
const deleteAllData = asyncHandler(async (req, res) => {
  const { confirmDelete } = req.body;

  if (!confirmDelete) {
    return res.status(400).json({
      success: false,
      message: 'Please confirm data deletion by sending confirmDelete: true.',
    });
  }

  const userId = req.user._id;

  await Promise.all([
    Journal.deleteMany({ userId }),
    MoodLog.deleteMany({ userId }),
    ChatSession.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ]);

  // Clear auth cookie
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.json({
    success: true,
    message: 'All your data has been permanently deleted. We\'re sorry to see you go.',
  });
});

module.exports = {
  completeOnboarding,
  updateProfile,
  updatePreferences,
  exportData,
  deleteAllData,
};
