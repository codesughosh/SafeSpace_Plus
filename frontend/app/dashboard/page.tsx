'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import WellnessSnapshot from '@/components/dashboard/WellnessSnapshot';
import MoodChart from '@/components/dashboard/MoodChart';
import DistressGauge from '@/components/dashboard/DistressGauge';
import StreakCard from '@/components/dashboard/StreakCard';
import RecommendationCards from '@/components/dashboard/RecommendationCards';
import CrisisAlert from '@/components/chat/CrisisAlert';
import { insightsAPI } from '@/lib/api';

interface DashboardData {
  distressScore: number;
  recentEntries: number;
  weeklyMoodAvg: number;
  showCrisisAlert: boolean;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    distressScore: 0,
    recentEntries: 0,
    weeklyMoodAvg: 0,
    showCrisisAlert: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insightsAPI.dashboard()
      .then(res => {
        const d = res.data;
        setData({
          distressScore: d.distressScore ?? 0,
          recentEntries: d.recentEntries ?? 0,
          weeklyMoodAvg: d.weeklyMoodAvg ?? 0,
          showCrisisAlert: (d.distressScore ?? 0) >= 75,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Crisis alert if high distress */}
        {data.showCrisisAlert && !loading && (
          <CrisisAlert onDismiss={() => setData(d => ({ ...d, showCrisisAlert: false }))} />
        )}

        {/* Wellness snapshot — full width */}
        <WellnessSnapshot distressScore={data.distressScore} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood chart — spans 2 cols */}
          <div className="lg:col-span-2">
            <MoodChart />
          </div>

          {/* Distress gauge */}
          <DistressGauge score={data.distressScore} loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Streak card */}
          <StreakCard />

          {/* Quick stats */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Journal entries', value: data.recentEntries, unit: 'this month', emoji: '📓', color: 'text-primary' },
              { label: 'Mood average', value: data.weeklyMoodAvg ? data.weeklyMoodAvg.toFixed(1) : '—', unit: 'past 7 days', emoji: '📊', color: 'text-secondary' },
              { label: 'Wellness score', value: Math.max(0, 100 - data.distressScore), unit: 'current', emoji: '💚', color: 'text-success' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                className="rounded-2xl bg-card border border-white/10 p-4 flex flex-col gap-2"
              >
                <span className="text-2xl">{stat.emoji}</span>
                <div>
                  <p className={`text-2xl font-display ${stat.color}`}>{loading ? '–' : stat.value}</p>
                  <p className="text-xs text-muted">{stat.unit}</p>
                  <p className="text-xs text-text-primary/70 mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recommendations row */}
        <div className="rounded-2xl bg-card border border-white/10 p-6">
          <RecommendationCards />
        </div>
      </div>
    </AppLayout>
  );
}
