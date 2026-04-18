'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, PenLine, Dumbbell, Moon, Heart, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { insightsAPI } from '@/lib/api';

interface Rec {
  type: string;
  title: string;
  description: string;
  instructions?: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'Breathing Exercise': { icon: Wind, color: 'text-secondary', bg: 'bg-secondary/10' },
  'Journaling Prompt': { icon: PenLine, color: 'text-primary', bg: 'bg-primary/10' },
  'Physical Activity': { icon: Dumbbell, color: 'text-success', bg: 'bg-success/10' },
  'Sleep Tip': { icon: Moon, color: 'text-accent', bg: 'bg-accent/10' },
  'Gratitude Practice': { icon: Heart, color: 'text-danger', bg: 'bg-danger/10' },
};

function RecCard({ rec, delay }: { rec: Rec; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = typeConfig[rec.type] || typeConfig['Gratitude Practice'];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex-shrink-0 w-64 rounded-2xl bg-card border border-white/10 p-4 flex flex-col gap-3"
    >
      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      <div>
        <p className="text-xs text-muted mb-1">{rec.type}</p>
        <h3 className="text-sm font-body font-semibold text-text-primary leading-snug">{rec.title}</h3>
        <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">{rec.description}</p>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 text-xs font-body transition-colors ${cfg.color} hover:opacity-80`}
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Close' : 'Try it'}
      </button>

      <AnimatePresence>
        {expanded && rec.instructions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`rounded-xl ${cfg.bg} border border-white/5 p-3`}>
              <p className="text-xs text-text-primary/80 leading-relaxed font-light">{rec.instructions}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RecommendationCards() {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const res = await insightsAPI.recommendations();
      setRecs(res.data.recommendations || []);
    } catch {
      setRecs([
        { type: 'Breathing Exercise', title: 'Box Breathing', description: 'A simple 4-4-4-4 breathing technique to calm your nervous system.', instructions: 'Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 4 times.' },
        { type: 'Gratitude Practice', title: 'Three Good Things', description: 'Write down three things that went well today, no matter how small.', instructions: 'Open your journal and list 3 things you\'re grateful for. They can be tiny — a warm drink, a smile, a song.' },
        { type: 'Journaling Prompt', title: 'Check In With Yourself', description: 'A reflective prompt to understand your emotional state right now.', instructions: 'Write for 5 minutes: "Right now I feel... and that\'s okay because..."' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecs(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-body font-semibold text-text-primary">Personalised for You</h2>
        <button
          onClick={fetchRecs}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-shrink-0 w-64 h-48 rounded-2xl bg-card border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {recs.map((rec, i) => (
            <RecCard key={i} rec={rec} delay={i * 0.1} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
