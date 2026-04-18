const { generateContent, parseGeminiJSON } = require('./geminiService');

// ─── Crisis keyword list ───────────────────────────────────────────────────────
const CRISIS_KEYWORDS = [
  'hopeless', 'worthless', "can't go on", 'end it', 'end my life',
  'suicide', 'suicidal', 'self-harm', 'self harm', 'hurt myself',
  'give up', 'no point', 'want to die', 'kill myself', 'not worth living',
  'rather be dead', 'disappear forever', 'no reason to live',
];

/**
 * Check text for crisis keywords.
 * Returns { flagged: boolean, matchedKeywords: string[] }
 */
const checkCrisisKeywords = (text) => {
  const lowerText = text.toLowerCase();
  const matchedKeywords = CRISIS_KEYWORDS.filter((kw) => lowerText.includes(kw));
  return {
    flagged: matchedKeywords.length > 0,
    matchedKeywords,
  };
};

/**
 * Crisis resource message for India.
 */
const CRISIS_RESOURCES_MESSAGE = `
I hear you, and I care about you deeply. What you're feeling matters. Please reach out to someone who can help right now:

🆘 **iCall** — 9152987821 (Mon–Sat, 8am–10pm)
🆘 **Vandrevala Foundation** — 1860-2662-345 (24/7)
🆘 **iMind** — 9741476476
🆘 **NIMHANS** — 080-46110007

You don't have to face this alone. A caring voice is just one call away. 💙
`.trim();

/**
 * Compute an overall distress score from recent journal entries and chat session.
 * @param {Array} recentJournals - Last 3 journal analysis objects
 * @param {number|null} chatDistressScore - From last chat session
 * @returns {Promise<{score: number, level: string}>}
 */
const computeOverallDistress = async (recentJournals, chatDistressScore = null) => {
  try {
    const journalScores = recentJournals
      .map((j) => j.analysis?.distressScore)
      .filter((s) => typeof s === 'number');

    const allScores = chatDistressScore !== null
      ? [...journalScores, chatDistressScore]
      : journalScores;

    if (allScores.length === 0) {
      return { score: 0, level: 'calm' };
    }

    // Weighted average: more recent entries count more
    let weightedSum = 0;
    let totalWeight = 0;
    allScores.forEach((score, i) => {
      const weight = i + 1;
      weightedSum += score * weight;
      totalWeight += weight;
    });

    const avgScore = Math.round(weightedSum / totalWeight);

    return {
      score: avgScore,
      level: getDistressLevel(avgScore),
    };
  } catch (error) {
    console.error('Distress computation error:', error.message);
    return { score: 0, level: 'calm' };
  }
};

/**
 * Map numeric score to display level.
 */
const getDistressLevel = (score) => {
  if (score <= 25) return 'calm';
  if (score <= 50) return 'mild';
  if (score <= 75) return 'moderate';
  return 'high';
};

/**
 * Generate Gemini-based distress assessment from aggregated data.
 */
const generateDistressAssessment = async (journals, persona) => {
  if (!journals.length) return { score: 0, level: 'calm' };

  const summaries = journals.map((j) => ({
    date: j.createdAt,
    distressScore: j.analysis?.distressScore || 0,
    themes: j.analysis?.keyThemes || [],
    sentiment: j.analysis?.sentiment || 'neutral',
  }));

  const prompt = `
Based on these recent journal analysis data points, compute an overall wellness distress score.
Data: ${JSON.stringify(summaries)}
User persona: ${persona}

Return a JSON object:
{
  "overallScore": number 0-100,
  "trend": "improving" | "stable" | "declining",
  "summary": "One sentence about the user's current emotional state"
}
Return only JSON. No markdown.
`;

  try {
    const raw = await generateContent(prompt);
    const parsed = parseGeminiJSON(raw);
    if (parsed) return parsed;
  } catch (error) {
    console.error('Distress assessment error:', error.message);
  }

  return { overallScore: 0, trend: 'stable', summary: 'Unable to assess at this time.' };
};

module.exports = {
  checkCrisisKeywords,
  computeOverallDistress,
  generateDistressAssessment,
  getDistressLevel,
  CRISIS_RESOURCES_MESSAGE,
};
