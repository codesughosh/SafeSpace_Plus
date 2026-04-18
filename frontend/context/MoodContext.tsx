'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { moodAPI } from '@/lib/api';

interface MoodLog {
  _id: string;
  score: number;
  note: string;
  source: string;
  date: string;
}

interface MoodContextType {
  moodHistory: MoodLog[];
  todayMood: number | null;
  fetchHistory: (days?: number) => Promise<void>;
  logMood: (score: number, note?: string) => Promise<void>;
}

const MoodContext = createContext<MoodContextType | null>(null);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [todayMood, setTodayMood] = useState<number | null>(null);

  const fetchHistory = async (days = 30) => {
    try {
      const res = await moodAPI.history(days);
      setMoodHistory(res.data.logs);
      // Check today
      const today = new Date().toDateString();
      const todayLog = res.data.logs.find(
        (l: MoodLog) => new Date(l.date).toDateString() === today
      );
      if (todayLog) setTodayMood(todayLog.score);
    } catch (e) {
      console.error('Failed to fetch mood history', e);
    }
  };

  const logMood = async (score: number, note = '') => {
    const res = await moodAPI.log({ score, note, source: 'manual' });
    setTodayMood(score);
    setMoodHistory((prev) => {
      const without = prev.filter(
        (l) => new Date(l.date).toDateString() !== new Date().toDateString()
      );
      return [...without, res.data.log].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });
  };

  return (
    <MoodContext.Provider value={{ moodHistory, todayMood, fetchHistory, logMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error('useMood must be used within MoodProvider');
  return ctx;
}
