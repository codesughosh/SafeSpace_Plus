const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  score: {
    type: Number,
    required: [true, 'Mood score is required'],
    min: [1, 'Score must be at least 1'],
    max: [10, 'Score cannot exceed 10'],
  },
  note: {
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters'],
    trim: true,
  },
  source: {
    type: String,
    enum: ['journal', 'manual', 'chat'],
    default: 'manual',
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// ─── Compound index for user + date range queries ─────────────────────────────
moodLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('MoodLog', moodLogSchema);
