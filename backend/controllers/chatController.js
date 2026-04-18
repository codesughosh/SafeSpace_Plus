const ChatSession = require('../models/ChatSession');
const Journal = require('../models/Journal');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { createChatSession, generateContent, parseGeminiJSON } = require('../services/geminiService');
const { checkCrisisKeywords, CRISIS_RESOURCES_MESSAGE, computeOverallDistress } = require('../services/distressService');

// ─── GET /api/chat/sessions — list past sessions ───────────────────────────────
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .limit(20)
    .select('title sessionSentiment distressScore createdAt updatedAt messages')
    .lean()
    .then((sessions) =>
      sessions.map((s) => ({
        ...s,
        messageCount: s.messages?.length || 0,
        messages: undefined, // Don't send full messages in list
      }))
    );

  res.json({ success: true, sessions });
});

// ─── GET /api/chat/sessions/:id — get full session ────────────────────────────
const getSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  res.json({ success: true, session });
});

// ─── POST /api/chat/session — create new session ──────────────────────────────
const createSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.create({
    userId: req.user._id,
    messages: [],
    title: 'New Conversation',
  });

  res.status(201).json({ success: true, session });
});

// ─── POST /api/chat/message — send message, get AI reply ──────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
  }

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID is required.' });
  }

  // Load session
  let session = await ChatSession.findOne({
    _id: sessionId,
    userId: req.user._id,
  });

  if (!session) {
    return res.status(404).json({ success: false, message: 'Chat session not found.' });
  }

  // Load user for persona + distress context
  const user = await User.findById(req.user._id).select('persona');
  const recentJournals = await Journal.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('analysis');

  const { score: recentDistressScore } = await computeOverallDistress(recentJournals);

  // ─── Crisis keyword detection ────────────────────────────────────────────────
  const crisisCheck = checkCrisisKeywords(message);
  let crisisDetected = crisisCheck.flagged;

  // ─── Build system prompt ─────────────────────────────────────────────────────
  const systemPrompt = `You are SafeSpace+, a compassionate AI mental health companion.

IMPORTANT:
- The user message MAY include an emotion in this format: [User emotion: X]
- If emotion is present → acknowledge it naturally (e.g., "I sense you might be feeling sad...")
- If NO emotion is present → respond normally based only on the message
- Never mention the format [User emotion: X] explicitly

Your role:
- Listen actively and respond with empathy, never judgment
- Validate the user's feelings before offering any advice
- Ask thoughtful follow-up questions to help the user reflect
- Offer gentle coping strategies when appropriate (breathing, grounding, journaling)
- NEVER diagnose, prescribe, or replace professional therapy
- If the user expresses suicidal ideation, self-harm intent, or crisis language, immediately and gently guide them to professional help and provide crisis resources
- Keep responses warm, concise (2–4 sentences), conversational

Context:
- User persona: ${user.persona || 'general'}
- User's recent distress score: ${recentDistressScore}/100
`;

  // ─── Build message history for Gemini ───────────────────────────────────────
  const geminiHistory = [];

  // Inject system prompt as first user message (Gemini pattern)
  if (session.messages.length === 0) {
    geminiHistory.push({
      role: 'user',
      parts: [{ text: systemPrompt + '\n\nPlease acknowledge your role briefly and warmly greet the user.' }],
    });
    geminiHistory.push({
      role: 'model',
      parts: [{ text: "Hello! I'm SafeSpace+, your compassionate AI companion. I'm here to listen without judgment and support you through whatever you're feeling. What's on your mind today? 💙" }],
    });
  }

  // Add existing conversation history
  session.messages.forEach((msg) => {
    geminiHistory.push({
      role: msg.role,
      parts: [{ text: msg.content }],
    });
  });

  // ─── Send message to Gemini ───────────────────────────────────────────────────
  let aiReply;
  try {
    const chat = createChatSession(geminiHistory);

    // --- SIMPLE KEYWORD-BASED RESPONSE ---
const lowerMsg = message.toLowerCase();

if (lowerMsg.includes("happy")) {
  aiReply = `That’s great to hear!
What’s making you feel happy right now?`; // happy detected
} else if (lowerMsg.includes("sad")) {
  aiReply = `I’m really sorry you’re feeling this way. Do you want to talk about what\’s making you feel sad?

If you don’t feel like explaining everything, that’s okay too. Sometimes even just putting a small part of it into words can help a little. I’m here to listen.` ; // sad detected
} 
else if(lowerMsg.includes("suicidal"))
  {
    `I’m here with you. Do you want to tell me what’s been going on?”

If you’re in India, you can also reach out to these helplines:

AASRA: 91-9820466726 (24/7)
Kiran Mental Health Helpline: 1800-599-0019
iCALL (TISS): 9152987821

You don’t have to handle things alone—there are people who genuinely want to help and listen.`;
  }

  else if(lowerMsg.includes("angry")  || lowerMsg.includes("frustrated"))
  {
    `It sounds like you’re really angry right now, and that’s completely valid—something must have really bothered you. I’m here to listen, so if you want to vent or tell me what happened, go ahead.

We don’t have to fix everything immediately. Sometimes it helps to just get it out first. If you feel overwhelmed, maybe take a slow breath for a moment—I’ll stay with you.

When you’re ready, we can also think through what to do next together.`
  }
  else {
  // fallback → call Gemini (your existing code)
  const result = await chat.sendMessage(message);
  aiReply = result.response.text();
}

  } catch (error) {
    console.error('Gemini chat error:', error.message);
    aiReply = "I'm having trouble connecting right now. Please try again in a moment. If you're in crisis, please call iCall at 9152987821 immediately.";
  }

  // ─── Prepend crisis resources if detected ────────────────────────────────────
  if (crisisDetected) {
    aiReply = CRISIS_RESOURCES_MESSAGE + '\n\n' + aiReply;
  }

  // ─── Save both messages to session ───────────────────────────────────────────
  session.messages.push({
    role: 'user',
    content: message,
    timestamp: new Date(),
    flaggedForCrisis: crisisDetected,
  });

  session.messages.push({
    role: 'model',
    content: aiReply,
    timestamp: new Date(),
    flaggedForCrisis: false,
  });

  // Auto-generate session title from first user message
  if (session.messages.length <= 2 && session.title === 'New Conversation') {
    session.title = message.slice(0, 60) + (message.length > 60 ? '...' : '');
  }

  await session.save();

  res.json({
    success: true,
    reply: aiReply,
    crisisDetected,
    session: {
      _id: session._id,
      title: session.title,
      messageCount: session.messages.length,
    },
  });
});

// ─── POST /api/chat/session/:id/summarize — end-of-session summary ────────────
const summarizeSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  if (session.messages.length === 0) {
    return res.json({ success: true, message: 'Empty session, nothing to summarize.' });
  }

  const conversationText = session.messages
    .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n');

  const prompt = `
Analyze this mental health support conversation and return a JSON object:
{
  "sessionSentiment": "positive" | "negative" | "neutral" | "mixed" | "crisis",
  "distressScore": number 0-100,
  "keyTopics": [array of up to 3 topic strings],
  "summary": "2-sentence summary of the conversation"
}
Conversation:
${conversationText}
Return only JSON. No markdown.
`;

  try {
    const raw = await generateContent(prompt);
    const parsed = parseGeminiJSON(raw);

    if (parsed) {
      session.sessionSentiment = parsed.sessionSentiment || 'neutral';
      session.distressScore = parsed.distressScore || 0;
      session.isActive = false;
      await session.save();

      return res.json({ success: true, summary: parsed });
    }
  } catch (error) {
    console.error('Session summary error:', error.message);
  }

  res.json({ success: true, message: 'Summary unavailable at this time.' });
});

module.exports = {
  getSessions,
  getSession,
  createSession,
  sendMessage,
  summarizeSession,
};
