'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Smile, ArrowRight, Sparkles, Sun, Moon, Coffee } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useMood } from '@/context/MoodContext';
import { insightsAPI } from '@/lib/api';

interface Props {
  distressScore: number;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: Sun };
  if (h < 17) return { text: 'Good afternoon', icon: Coffee };
  return { text: 'Good evening', icon: Moon };
}

export default function WellnessSnapshot({ distressScore }: Props) {
  const { user } = useAuth();
  const { todayMood, logMood } = useMood();
  const [tip, setTip] = useState<string>('');
  const [tipLoading, setTipLoading] = useState(true);
  const [quickMood, setQuickMood] = useState<number | null>(null);
  const [logging, setLogging] = useState(false);

  const greeting = getGreeting();
  const GreetIcon = greeting.icon;

  useEffect(() => {
    insightsAPI.recommendations()
      .then(res => {
        const recs = res.data?.recommendations;
        if (recs?.[0]?.description) setTip(recs[0].description);
        else setTip('Take a breath. You\'re doing better than you think. 💙');
      })
      .catch(() => setTip('Small steps forward are still steps forward. Keep going. 🌱'))
      .finally(() => setTipLoading(false));
  }, []);

  const handleLogMood = async (score: number) => {
    setLogging(true);
    try {
      await logMood(score, '');
      setQuickMood(score);
    } finally {
      setLogging(false);
    }
  };

  const moodEmojis = [
    { score: 2, emoji: '😔', label: 'Low' },
    { score: 4, emoji: '😐', label: 'Okay' },
    { score: 6, emoji: '🙂', label: 'Good' },
    { score: 8, emoji: '😊', label: 'Great' },
    { score: 10, emoji: '🤩', label: 'Amazing' },
  ];

  const currentMood = todayMood || quickMood;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gradient-to-br from-primary/20 via-card to-secondary/10 border border-white/10 p-6 lg:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Left: greeting + tip */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <GreetIcon className="w-4 h-4 text-accent" />
            <span className="text-muted text-sm font-body">{greeting.text}</span>
          </div>
          <h1 className="text-2xl font-display text-text-primary mb-3">
            {user?.name?.split(' ')[0] || 'Friend'} 👋
          </h1>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
            <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            {tipLoading ? (
              <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
            ) : (
              <p className="text-sm text-text-primary/80 font-light italic leading-relaxed">{tip}</p>
            )}
          </div>
        </div>

        {/* Center: streak */}
        <div className="flex items-center gap-4 lg:border-x border-white/10 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-5 h-5 text-warning" />
              <span className="text-2xl font-display text-text-primary">{user?.streak?.current || 0}</span>
            </div>
            <p className="text-xs text-muted">Day streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-display text-secondary">{user?.streak?.longest || 0}</span>
            </div>
            <p className="text-xs text-muted">Best streak</p>
          </div>
        </div>

        {/* Right: mood log */}
        <div className="flex-shrink-0">
          {currentMood ? (
            <div className="text-center p-4 rounded-xl bg-success/10 border border-success/20">
              <Smile className="w-6 h-6 text-success mx-auto mb-1" />
              <p className="text-sm text-success font-body">Mood logged</p>
              <p className="text-2xl font-display text-text-primary">{currentMood}/10</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted mb-2 text-center">How are you feeling?</p>
              <div className="flex gap-2">
                {moodEmojis.map(({ score, emoji, label }) => (
                  <button
                    key={score}
                    onClick={() => handleLogMood(score)}
                    disabled={logging}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/10 transition-all hover:scale-110 disabled:opacity-50"
                    title={label}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-xs text-muted">{label}</span>
                  </button>
                ))}
              </div>
              <Link
                href="/journal/new"
                className="mt-2 flex items-center justify-center gap-1 text-xs text-primary hover:underline"
              >
                Log in journal <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
