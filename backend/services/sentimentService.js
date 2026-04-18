const { generateContent, parseGeminiJSON } = require('./geminiService');

/**
 * Analyze journal entry sentiment and emotional tone.
 * Returns structured analysis object.
 */
const analyzeJournalEntry = async (entryText, userPersona = 'general') => {
  const prompt = `
You are a compassionate mental health AI. Analyze the following journal entry and return 
a JSON object with exactly these fields:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "emotionalTone": [array of up to 3 detected emotions as strings],
  "distressScore": number between 0 and 100,
  "distressLevel": "none" | "mild" | "moderate" | "high",
  "keyThemes": [array of up to 5 short theme strings],
  "supportiveInsight": "A 2-3 sentence empathetic reflection for the user",
  "suggestedAction": "One concrete, gentle suggestion for the user right now"
}
Journal entry: "${entryText.replace(/"/g, '\\"')}"
User persona: "${userPersona}"
Return only the JSON object. No explanation. No markdown.
`;

  try {
    const raw = await generateContent(prompt);
    const parsed = parseGeminiJSON(raw);

    if (!parsed) {
      return getFallbackAnalysis();
    }

    // Validate and sanitize required fields
    return {
      sentiment: ['positive', 'negative', 'neutral', 'mixed'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral',
      emotionalTone: Array.isArray(parsed.emotionalTone)
        ? parsed.emotionalTone.slice(0, 3)
        : [],
      distressScore: typeof parsed.distressScore === 'number'
        ? Math.min(100, Math.max(0, parsed.distressScore))
        : 0,
      distressLevel: ['none', 'mild', 'moderate', 'high'].includes(parsed.distressLevel)
        ? parsed.distressLevel
        : 'none',
      keyThemes: Array.isArray(parsed.keyThemes)
        ? parsed.keyThemes.slice(0, 5)
        : [],
      supportiveInsight: parsed.supportiveInsight || 'Thank you for sharing your thoughts.',
      suggestedAction: parsed.suggestedAction || 'Take a few deep breaths and be kind to yourself today.',
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error.message);
    return getFallbackAnalysis();
  }
};

/**
 * Fallback analysis when Gemini is unavailable.
 */
const getFallbackAnalysis = () => ({
  sentiment: 'neutral',
  emotionalTone: [],
  distressScore: 0,
  distressLevel: 'none',
  keyThemes: [],
  supportiveInsight: 'Thank you for taking the time to journal today. Reflection is a powerful act of self-care.',
  suggestedAction: 'Take a moment to breathe deeply and acknowledge your feelings without judgment.',
});

module.exports = { analyzeJournalEntry };
