'use client';
import { motion } from 'framer-motion';
import { MessageCircle, Lightbulb, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Analysis {
  sentiment: string;
  emotionalTone: string[];
  distressScore: number;
  distressLevel: string;
  keyThemes: string[];
  supportiveInsight: string;
  suggestedAction: string;
}

interface Props {
  analysis: Analysis;
}

const distressConfig = {
  none: { color: '#26de81', bg: 'bg-success/10', border: 'border-success/20', label: 'No Distress' },
  mild: { color: '#F7B731', bg: 'bg-accent/10', border: 'border-accent/20', label: 'Mild' },
  moderate: { color: '#FFA500', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Moderate' },
  high: { color: '#FC5C65', bg: 'bg-danger/10', border: 'border-danger/20', label: 'High' },
} as const;

const sentimentEmoji: Record<string, string> = {
  positive: '😊', negative: '😔', neutral: '😐', mixed: '🔄',
};

export default function SentimentBadge({ analysis }: Props) {
  const distress = distressConfig[analysis.distressLevel as keyof typeof distressConfig] || distressConfig.none;
  const isHigh = analysis.distressLevel === 'high';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-card border border-white/10 p-5 space-y-4"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <span className="text-lg">{sentimentEmoji[analysis.sentiment] || '💭'}</span>
        <div>
          <p className="text-sm font-body font-semibold text-text-primary">AI Analysis</p>
          <p className="text-xs text-muted capitalize">{analysis.sentiment} sentiment detected</p>
        </div>
        <div className="ml-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body ${distress.bg} ${distress.border} border`}
            style={{ color: distress.color }}
          >
            {isHigh && <AlertTriangle className="w-3 h-3" />}
            {distress.label}
          </span>
        </div>
      </div>

      {/* Emotional tone chips */}
      {analysis.emotionalTone?.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-2">Detected emotions</p>
          <div className="flex flex-wrap gap-2">
            {analysis.emotionalTone.map(e => (
              <span key={e} className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary capitalize">
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key themes */}
      {analysis.keyThemes?.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-2">Key themes</p>
          <div className="flex flex-wrap gap-2">
            {analysis.keyThemes.map(t => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted capitalize">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Supportive insight */}
      {analysis.supportiveInsight && (
        <div className="p-3 rounded-xl bg-primary/5 border-l-2 border-primary/40">
          <p className="text-sm text-text-primary/90 font-light italic leading-relaxed">
            "{analysis.supportiveInsight}"
          </p>
        </div>
      )}

      {/* Suggested action */}
      {analysis.suggestedAction && (
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-primary/80 leading-relaxed">{analysis.suggestedAction}</p>
        </div>
      )}

      {/* High distress CTA */}
      {isHigh && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between p-3 rounded-xl bg-danger/10 border border-danger/20"
        >
          <p className="text-sm text-text-primary">
            It sounds like you're going through a lot. Would you like to talk?
          </p>
          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/20 text-danger text-xs font-body font-medium hover:bg-danger/30 transition-all whitespace-nowrap"
          >
            <MessageCircle className="w-3 h-3" />
            Open Chat
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
