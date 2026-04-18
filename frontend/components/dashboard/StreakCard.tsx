'use client';
import { motion } from 'framer-motion';
import { Flame, PenLine } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function StreakCard() {
  const { user } = useAuth();
  const streak = user?.streak?.current || 0;
  const longest = user?.streak?.longest || 0;

  const flames = Math.min(streak, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl bg-card border border-white/10 p-6 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-warning" />
        <h2 className="text-sm font-body font-semibold text-text-primary">Journaling Streak</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-2">
        {/* Flame icons */}
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 400 }}
            >
              <Flame
                className={`w-6 h-6 transition-all ${
                  i < flames ? 'text-warning drop-shadow-[0_0_6px_rgba(255,165,0,0.6)]' : 'text-white/10'
                }`}
              />
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-4xl font-display text-text-primary">{streak}</p>
          <p className="text-sm text-muted">day{streak !== 1 ? 's' : ''} in a row</p>
        </div>

        <div className="flex gap-4 text-center">
          <div>
            <p className="text-lg font-display text-secondary">{longest}</p>
            <p className="text-xs text-muted">Best ever</p>
          </div>
        </div>
      </div>

      <Link
        href="/journal/new"
        className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-body hover:bg-primary/25 transition-all"
      >
        <PenLine className="w-4 h-4" />
        Write today's entry
      </Link>
    </motion.div>
  );
}
