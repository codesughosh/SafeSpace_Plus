const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set — AI features will be unavailable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const getModel = () => genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Single-turn content generation (analysis, reports, recommendations).
 * @param {string} prompt
 * @returns {Promise<string>}
 */
const generateContent = async (prompt) => {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
};

/**
 * Multi-turn chat session (chatbot).
 * @param {Array<{role: string, parts: Array<{text: string}>}>} history
 * @returns {ChatSession}
 */
const createChatSession = (history = []) => {
  const model = getModel();
  return model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.7,
      topP: 0.9,
    },
  });
};

/**
 * Safely parse JSON from Gemini response.
 * Strips markdown code fences if present.
 * @param {string} text
 * @returns {object|null}
 */
const parseGeminiJSON = (text) => {
  try {
    // Strip ```json ... ``` or ``` ... ``` wrappers
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    console.error('⚠️  Failed to parse Gemini JSON response:', text?.slice(0, 200));
    return null;
  }
};

module.exports = { generateContent, createChatSession, parseGeminiJSON };
