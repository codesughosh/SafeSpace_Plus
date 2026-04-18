'use client';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import VoiceInputButton from '@/components/journal/VoiceInputButton';
import SentimentBadge from '@/components/journal/SentimentBadge';
import { journalAPI } from '@/lib/api';

const EMOTIONS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤩', label: 'Excited' },
  { emoji: '😔', label: 'Hopeless' },
];

const PROMPTS = [
  "What's weighing on your mind today?",
  "What are you grateful for right now?",
  "Describe a moment that challenged you recently.",
  "What would make today feel better?",
  "Write about something you're proud of.",
];

interface Analysis {
  sentiment: string;
  emotionalTone: string[];
  distressScore: number;
  distressLevel: string;
  keyThemes: string[];
  supportiveInsight: string;
  suggestedAction: string;
}

export default function NewJournalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [moodScore, setMoodScore] = useState(5);
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('text');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState('');

  const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

  const toggleEmotion = (label: string) => {
    setSelectedEmotions(prev =>
      prev.includes(label) ? prev.filter(e => e !== label) : [...prev, label]
    );
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setContent(prev => prev + text);
    setInputMethod('voice');
  }, []);

  const handleSave = async () => {
    if (!content.trim()) { setError('Please write something before saving.'); return; }
    setError('');
    setSaving(true);

    try {
      const res = await journalAPI.create({
        title: title || `Entry – ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
        content,
        emotionTags: selectedEmotions,
        moodScore,
        inputMethod,
      });

      const entryId = res.data.journal._id;

      // Trigger analysis
      setAnalyzing(true);
      setSaving(false);
      try {
        const aRes = await journalAPI.analyze(entryId);
        setAnalysis(aRes.data.analysis);
      } catch {
        // Analysis failed but entry saved
      } finally {
        setAnalyzing(false);
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const moodEmojis = ['😔', '😕', '😐', '🙂', '😊', '😄', '🤩', '✨', '🌟', '💫'];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/journal" className="p-2 rounded-xl text-muted hover:text-text-primary hover:bg-white/5 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-display text-text-primary">New Entry</h1>
            <p className="text-xs text-muted">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Editor card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-white/10 p-6 space-y-5"
        >
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give this entry a title (optional)"
            className="w-full bg-transparent text-text-primary font-display text-lg placeholder:text-muted/40 outline-none border-b border-white/5 pb-3"
          />

          {/* Voice + content area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <VoiceInputButton onTranscript={handleVoiceTranscript} disabled={saving || analyzing} />
              <span className="text-xs text-muted">{content.length} chars</span>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={randomPrompt}
              rows={8}
              className="w-full bg-transparent text-text-primary/90 font-body text-sm placeholder:text-muted/30 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Emotion tagger */}
          <div>
            <p className="text-xs text-muted mb-2">How are you feeling?</p>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map(({ emoji, label }) => (
                <button
                  key={label}
                  onClick={() => toggleEmotion(label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                    selectedEmotions.includes(label)
                      ? 'bg-primary/20 border border-primary/40 text-primary'
                      : 'bg-white/5 border border-white/10 text-muted hover:border-white/20 hover:text-text-primary'
                  }`}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted">Overall mood</p>
              <span className="text-lg">{moodEmojis[moodScore - 1]}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted w-3">1</span>
              <input
                type="range"
                min={1}
                max={10}
                value={moodScore}
                onChange={e => setMoodScore(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-white/10 accent-primary cursor-pointer"
              />
              <span className="text-xs text-muted w-3">10</span>
              <span className="text-sm font-display text-primary w-4">{moodScore}</span>
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-xs text-danger">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || analyzing || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-body font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving || analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{analyzing ? 'Analysing…' : 'Saving…'}</>
              ) : (
                <><Save className="w-4 h-4" />Save Entry</>
              )}
            </button>

            {analysis && (
              <button
                onClick={() => router.push('/journal')}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-muted text-sm hover:text-text-primary hover:border-white/20 transition-all"
              >
                Done
              </button>
            )}
          </div>
        </motion.div>

        {/* Sentiment result */}
        {analysis && <SentimentBadge analysis={analysis} />}
      </div>
    </AppLayout>
  );
}
