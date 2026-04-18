'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useMood } from '@/context/MoodContext';

export default function MoodChart() {
  const { moodHistory, fetchHistory } = useMood();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory(14).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const initChart = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      // Build last 14 days
      const days: string[] = [];
      const scores: (number | null)[] = [];
      const today = new Date();

      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        days.push(label);

        const entry = moodHistory.find(
          (l) => new Date(l.date).toDateString() === d.toDateString()
        );
        scores.push(entry ? entry.score : null);
      }

      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy();
      }

      const ctx = canvasRef.current!.getContext('2d')!;
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(108,99,255,0.3)');
      gradient.addColorStop(1, 'rgba(108,99,255,0)');

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: days,
          datasets: [{
            label: 'Mood',
            data: scores,
            borderColor: '#6C63FF',
            backgroundColor: gradient,
            borderWidth: 2.5,
            pointBackgroundColor: scores.map(s =>
              s === null ? 'transparent' :
              s >= 7 ? '#26de81' :
              s >= 4 ? '#F7B731' : '#FC5C65'
            ),
            pointBorderColor: 'transparent',
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.4,
            fill: true,
            spanGaps: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#16213E',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              titleColor: '#94A3B8',
              bodyColor: '#E2E8F0',
              callbacks: {
                label: (ctx) => ctx.parsed.y !== null ? ` Mood: ${ctx.parsed.y}/10` : ' No entry',
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.03)' },
              ticks: {
                color: '#94A3B8',
                font: { size: 11 },
                maxRotation: 0,
                maxTicksLimit: 7,
              },
              border: { display: false },
            },
            y: {
              min: 0,
              max: 10,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#94A3B8',
                font: { size: 11 },
                stepSize: 2,
              },
              border: { display: false },
            },
          },
        },
      });
    };

    initChart();

    return () => {
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy();
    };
  }, [moodHistory, loading]);

  const avg = moodHistory.length
    ? (moodHistory.reduce((s, l) => s + l.score, 0) / moodHistory.length).toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl bg-card border border-white/10 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-body font-semibold text-text-primary">14-Day Mood Trend</h2>
        </div>
        {avg && (
          <span className="text-xs text-muted bg-white/5 px-2 py-1 rounded-lg">
            Avg: <span className="text-text-primary">{avg}</span>/10
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : moodHistory.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-3xl">📈</span>
          <p className="text-sm text-muted">Start logging your mood to see your trend</p>
        </div>
      ) : (
        <div className="h-48">
          <canvas ref={canvasRef} />
        </div>
      )}
    </motion.div>
  );
}
