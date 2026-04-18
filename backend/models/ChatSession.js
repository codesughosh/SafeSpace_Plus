const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  flaggedForCrisis: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  messages: [messageSchema],
  sessionSentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral', 'mixed', 'crisis', null],
    default: null,
  },
  distressScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  title: {
    type: String,
    maxlength: 150,
    default: 'New Conversation',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// ─── Index for listing sessions sorted by most recent ─────────────────────────
chatSessionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
