const Journal = require('../models/Journal');
const MoodLog = require('../models/MoodLog');
const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateContent, parseGeminiJSON } = require('../services/geminiService');
const { computeOverallDistress, generateDistressAssessment } = require('../services/distressService');

// ─── GET /api/insights/dashboard — aggregated dashboard data ──────────────────
const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch data in parallel
  const [user, recentJournals, moodLogs14, lastChatSession] = await Promise.all([
    User.findById(userId).select('name persona streak preferences'),
    Journal.find({ userId }).sort({ createdAt: -1 }).limit(3).select('title analysis createdAt'),
    MoodLog.find({
      userId,
      date: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    }).sort({ date: 1 }),
    ChatSession.findOne({ userId }).sort({ updatedAt: -1 }).select('distressScore'),
  ]);

  // Compute distress gauge score
  const distress = await computeOverallDistress(
    recentJournals,
    lastChatSession?.distressScore ?? null
  );

  // Generate daily tip from Gemini
  let dailyTip = "Take a moment today to check in with yourself. How are you really doing?";
  try {
    const lastMood = moodLogs14[moodLogs14.length - 1]?.score;
    const tipPrompt = `Generate a single warm, actionable daily wellness tip in 1 sentence for a ${user.persona || 'general'} user whose most recent mood score was ${lastMood || 'unknown'}/10. Be specific and gentle. No quotes. No intro phrase.`;
    dailyTip = (await generateContent(tipPrompt)).trim().replace(/^["']|["']$/g, '');
  } catch (e) {
    // Use fallback
  }

  // Check if today's mood is logged
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMood = await MoodLog.findOne({
    userId,
    date: { $gte: todayStart },
  }).select('score');

  res.json({
    success: true,
    data: {
      user: {
        name: user.name,
        persona: user.persona,
        streak: user.streak,
      },
      todayMood: todayMood?.score || null,
      dailyTip,
      distress,
      moodChart: moodLogs14.map((log) => ({
        date: log.date,
        score: log.score,
      })),
      recentJournals: recentJournals.map((j) => ({
        _id: j._id,
        title: j.title,
        distressScore: j.analysis?.distressScore,
        sentiment: j.analysis?.sentiment,
        createdAt: j.createdAt,
      })),
    },
  });
});

// ─── GET /api/insights/wordcloud — themes from last 30 journals ────────────────
const getWordCloud = asyncHandler(async (req, res) => {
  const journals = await Journal.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .select('analysis.keyThemes analysis.sentiment');

  // Build frequency map with sentiment weighting
  const themeMap = {};
  journals.forEach((journal) => {
    const themes = journal.analysis?.keyThemes || [];
    const sentiment = journal.analysis?.sentiment || 'neutral';
    themes.forEach((theme) => {
      const key = theme.toLowerCase().trim();
      if (!key) return;
      if (!themeMap[key]) {
        themeMap[key] = { text: theme, count: 0, sentiment };
      }
      themeMap[key].count += 1;
    });
  });

  const words = Object.values(themeMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);

  res.json({ success: true, words });
});

// ─── POST /api/insights/recommendations — Gemini recommendations ───────────────
const getRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('persona');
  const recentJournals = await Journal.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('analysis');

  const { score: distressScore, level: distressLevel } = await computeOverallDistress(recentJournals);

  const prompt = `
You are a compassionate mental wellness coach. Generate exactly 3 personalized wellness recommendations.

User context:
- Persona: ${user.persona || 'general'}
- Current distress level: ${distressLevel} (score: ${distressScore}/100)

Return a JSON array of exactly 3 objects, each with:
{
  "type": "breathing" | "journaling" | "physical" | "sleep" | "gratitude",
  "title": "Short title (max 6 words)",
  "description": "2 sentences of warm, practical guidance",
  "duration": "e.g., '5 minutes' or '10 minutes'",
  "instructions": "Step-by-step instructions in 3-4 short steps"
}

Make the recommendations highly specific to the user's persona and distress level.
Return only the JSON array. No markdown.
`;

  try {
    const raw = await generateContent(prompt);
    const recommendations = parseGeminiJSON(raw);

    if (Array.isArray(recommendations)) {
      return res.json({ success: true, recommendations });
    }
  } catch (error) {
    console.error('Recommendations error:', error.message);
  }

  // Fallback recommendations
  res.json({
    success: true,
    recommendations: [
      {
        type: 'breathing',
        title: 'Box Breathing Exercise',
        description: 'A simple technique to calm your nervous system in minutes. It helps reduce stress and improve focus.',
        duration: '5 minutes',
        instructions: '1. Inhale for 4 counts\n2. Hold for 4 counts\n3. Exhale for 4 counts\n4. Hold for 4 counts\n5. Repeat 4 times',
      },
      {
        type: 'gratitude',
        title: 'Gratitude Journaling',
        description: 'Write down three things you\'re grateful for today. Research shows this can significantly improve mood.',
        duration: '5 minutes',
        instructions: '1. Find a quiet space\n2. Write three specific things you\'re grateful for\n3. For each one, note why it matters to you',
      },
      {
        type: 'physical',
        title: 'Mindful Walk',
        description: 'A short walk can boost your mood and clear your mind. Focus on your senses as you walk.',
        duration: '10 minutes',
        instructions: '1. Step outside or find space to walk\n2. Notice 5 things you can see\n3. Focus on your breathing and each step\n4. Let thoughts pass without judgment',
      },
    ],
  });
});

// ─── POST /api/insights/weekly-report — Gemini weekly wellness report ──────────
const getWeeklyReport = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('persona name');
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [journals, moodLogs] = await Promise.all([
    Journal.find({ userId: req.user._id, createdAt: { $gte: weekStart } })
      .select('analysis.distressScore analysis.sentiment analysis.keyThemes analysis.emotionalTone createdAt'),
    MoodLog.find({ userId: req.user._id, date: { $gte: weekStart } })
      .select('score date source'),
  ]);

  const weeklyData = {
    journalCount: journals.length,
    avgMoodScore: moodLogs.length
      ? Math.round(moodLogs.reduce((s, l) => s + l.score, 0) / moodLogs.length * 10) / 10
      : null,
    moodScores: moodLogs.map((l) => ({ date: l.date, score: l.score })),
    distressScores: journals.map((j) => ({
      date: j.createdAt,
      score: j.analysis?.distressScore,
      sentiment: j.analysis?.sentiment,
    })),
    allThemes: journals.flatMap((j) => j.analysis?.keyThemes || []),
    allEmotions: journals.flatMap((j) => j.analysis?.emotionalTone || []),
  };

  const prompt = `
Write a warm, personal weekly wellness report for ${user.name}.

Data from the past 7 days:
${JSON.stringify(weeklyData, null, 2)}

User persona: ${user.persona || 'general'}

Write exactly 3 paragraphs:
1. Acknowledge what went well emotionally this week (be specific to the data)
2. Identify patterns to be mindful of going forward
3. One personalized, actionable suggestion for next week

Tone: Warm, encouraging, non-clinical. Like a caring friend who has observed you this week.
Return plain text only — no markdown, no headers, no bullets. Just 3 paragraphs.
`;

  try {
    const report = await generateContent(prompt);
    return res.json({ success: true, report: report.trim() });
  } catch (error) {
    console.error('Weekly report error:', error.message);
  }

  res.json({
    success: true,
    report: `You've been on a meaningful journey this week, ${user.name}. Every moment you took to check in with yourself — through journaling, tracking your mood, or simply pausing — counts as an act of self-care.\n\nRemember that emotional wellness isn't about feeling good every day — it's about building awareness and resilience over time. Keep noticing your patterns with curiosity rather than judgment.\n\nFor next week, try to set aside just five minutes each morning to write down one intention for the day. Small, consistent acts of self-reflection can create profound shifts over time. You're doing better than you think.`,
  });
});

module.exports = {
  getDashboardData,
  getWordCloud,
  getRecommendations,
  getWeeklyReport,
};
