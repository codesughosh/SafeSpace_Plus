const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral', 'mixed'],
  },
  emotionalTone: [{ type: String }],
  distressScore: { type: Number, min: 0, max: 100 },
  distressLevel: {
    type: String,
    enum: ['none', 'mild', 'moderate', 'high'],
  },
  keyThemes: [{ type: String }],
  supportiveInsight: String,
  suggestedAction: String,
  analyzedAt: { type: Date, default: Date.now },
}, { _id: false });

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    default: '',
  },
  content: {
    type: String,
    required: [true, 'Journal content is required'],
    maxlength: [10000, 'Journal entry cannot exceed 10,000 characters'],
  },
  emotionTags: {
  type: [String],
  enum: ["Happy", "Sad", "Angry", "Neutral", "Excited", "Anxious"]
},
  moodScore: {
    type: Number,
    min: 1,
    max: 10,
  },
  inputMethod: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text',
  },
  analysis: analysisSchema,
}, {
  timestamps: true,
});

// ─── Index for efficient user queries sorted by date ──────────────────────────
journalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Journal', journalSchema);
