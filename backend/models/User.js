const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const intakeResponseSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: Number, min: 1, max: 5 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  persona: {
    type: String,
    enum: ['student', 'professional', 'general'],
    default: 'general',
  },
  intakeAssessment: {
    responses: [intakeResponseSchema],
    initialWellnessScore: { type: Number, min: 0, max: 100 },
    completedAt: Date,
  },
  preferences: {
    allowPersonalization: { type: Boolean, default: true },
    onboardingComplete: { type: Boolean, default: false },
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastJournalDate: { type: Date, default: null },
  },
}, {
  timestamps: true,
});

// ─── Hash password before saving ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method: update journaling streak ────────────────────────────────
userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = this.streak.lastJournalDate
    ? new Date(this.streak.lastJournalDate)
    : null;

  if (lastDate) {
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already journaled today — no change
      return;
    } else if (diffDays === 1) {
      // Consecutive day — increment streak
      this.streak.current += 1;
    } else {
      // Streak broken
      this.streak.current = 1;
    }
  } else {
    this.streak.current = 1;
  }

  this.streak.lastJournalDate = today;
  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current;
  }
};

module.exports = mongoose.model('User', userSchema);
