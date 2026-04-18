'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Cloud, PieChart, FileText, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import WordCloud from '@/components/shared/WordCloud';
import { insightsAPI, moodAPI } from '@/lib/api';

interface WordEntry { text: string; count: number; sentiment?: string; }
interface WeeklyReport { report: string; generatedAt: string; }

function SectionCard({ title, icon: Icon, children, delay = 0 }: {
  title: string; icon: React.ElementType; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl bg-card border border-white/10 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-body font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function MoodTrendChart({ days }: { days: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Array<{ score: number; date: string }>>([]);

  useEffect(() => {
    moodAPI.history(days).then(res => {
      setLogs(res.data.logs || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    if (!canvasRef.current || loading) return;
    const init = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy();

      const allDays: string[] = [];
      const scores: (number | null)[] = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        allDays.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const e = logs.find(l => new Date(l.date).toDateString() === d.toDateString());
        scores.push(e ? e.score : null);
      }

      const ctx = canvasRef.current!.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, 200);
      grad.addColorStop(0, 'rgba(108,99,255,0.25)');
      grad.addColorStop(1, 'rgba(108,99,255,0)');

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: allDays,
          datasets: [{
            label: 'Mood',
            data: scores,
            borderColor: '#6C63FF',
            backgroundColor: grad,
            borderWidth: 2,
            pointBackgroundColor: scores.map(s => s === null ? 'transparent' : s >= 7 ? '#26de81' : s >= 4 ? '#F7B731' : '#FC5C65'),
            pointRadius: 4,
            tension: 0.4,
            fill: true,
            spanGaps: true,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#16213E', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
              titleColor: '#94A3B8', bodyColor: '#E2E8F0',
            },
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94A3B8', font: { size: 10 }, maxTicksLimit: 8 }, border: { display: false } },
            y: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8', font: { size: 10 }, stepSize: 2 }, border: { display: false } },
          },
        },
      });
    };
    init();
    return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy(); };
  }, [logs, loading, days]);

  return loading ? (
    <div className="h-52 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ) : logs.length === 0 ? (
    <div className="h-52 flex flex-col items-center justify-center gap-2 text-center">
      <span className="text-3xl">📈</span>
      <p className="text-sm text-muted">Log moods to see your trend</p>
    </div>
  ) : (
    <div className="h-52"><canvas ref={canvasRef} /></div>
  );
}

function EmotionDonut() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ label: string; count: number }[]>([]);

  useEffect(() => {
    insightsAPI.dashboard().then(res => {
      setData(res.data.emotionDistribution || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!canvasRef.current || loading || data.length === 0) return;
    const init = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy();

      const colors = ['#6C63FF', '#48CAE4', '#26de81', '#F7B731', '#FC5C65', '#FFA500', '#94A3B8', '#E2E8F0'];

      chartRef.current = new Chart(canvasRef.current!.getContext('2d')!, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.label),
          datasets: [{ data: data.map(d => d.count), backgroundColor: colors.slice(0, data.length), borderColor: '#16213E', borderWidth: 2 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#94A3B8', font: { size: 11 }, padding: 12, boxWidth: 10 } },
            tooltip: { backgroundColor: '#16213E', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, bodyColor: '#E2E8F0', titleColor: '#94A3B8' },
          },
        },
      });
    };
    init();
    return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy(); };
  }, [data, loading]);

  return loading ? (
    <div className="h-44 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ) : data.length === 0 ? (
    <div className="h-44 flex flex-col items-center justify-center gap-2 text-center">
      <span className="text-3xl">🎭</span>
      <p className="text-sm text-muted">Tag emotions in your journal entries to see distribution</p>
    </div>
  ) : (
    <div className="h-44"><canvas ref={canvasRef} /></div>
  );
}

export default function InsightsPage() {
  const [wordCloudData, setWordCloudData] = useState<WordEntry[]>([]);
  const [wcLoading, setWcLoading] = useState(true);
  const [moodDays, setMoodDays] = useState(30);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    insightsAPI.wordCloud()
      .then(res => setWordCloudData(res.data.words || []))
      .catch(() => {})
      .finally(() => setWcLoading(false));
  }, []);

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await insightsAPI.weeklyReport();
      setReport({ report: res.data.report, generatedAt: new Date().toISOString() });
    } catch {
      setReport({ report: 'Unable to generate report right now. Please try again in a moment.', generatedAt: new Date().toISOString() });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display text-text-primary">Your Insights</h1>
          <p className="text-sm text-muted mt-1">Patterns, trends, and reflections from your wellness journey</p>
        </motion.div>

        {/* Mood trend — full width */}
        <SectionCard title="Mood Trend" icon={BarChart3} delay={0.05}>
          <div className="flex items-center gap-2 mb-4">
            {[14, 30, 60].map(d => (
              <button
                key={d}
                onClick={() => setMoodDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-body transition-all ${
                  moodDays === d
                    ? 'bg-primary/20 border border-primary/30 text-primary'
                    : 'text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <MoodTrendChart days={moodDays} />
        </SectionCard>

        {/* Word cloud + emotion dist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Journal Themes" icon={Cloud} delay={0.1}>
            {wcLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <WordCloud words={wordCloudData} />
                <div className="flex gap-4 mt-3 text-xs text-muted justify-center">
                  {[
                    { color: '#26de81', label: 'Positive' },
                    { color: '#F7B731', label: 'Mixed' },
                    { color: '#FC5C65', label: 'Negative' },
                    { color: '#48CAE4', label: 'Neutral' },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title="Emotion Distribution" icon={PieChart} delay={0.15}>
            <EmotionDonut />
          </SectionCard>
        </div>

        {/* Weekly AI Report */}
        <SectionCard title="Weekly Wellness Report" icon={FileText} delay={0.2}>
          {!report ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-text-primary font-body font-medium">Get your AI-generated wellness report</p>
                <p className="text-xs text-muted mt-1 max-w-sm">
                  A personalised 3-paragraph summary of your emotional patterns, wins, and one action for next week.
                </p>
              </div>
              <button
                onClick={generateReport}
                disabled={reportLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm hover:bg-accent/25 transition-all disabled:opacity-50"
              >
                {reportLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                  : <><Sparkles className="w-4 h-4" />Generate Report</>
                }
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-white/5">
                {report.report.split('\n\n').filter(Boolean).map((para, i) => (
                  <p key={i} className={`text-sm leading-relaxed ${i > 0 ? 'mt-3' : ''} ${
                    i === 0 ? 'text-text-primary' : 'text-text-primary/80 font-light'
                  }`}>
                    {para}
                  </p>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">
                  Generated {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
                <button
                  onClick={generateReport}
                  disabled={reportLoading}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${reportLoading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </motion.div>
          )}
        </SectionCard>
      </div>
    </AppLayout>
  );
}
