'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PenLine, Trash2, Search, BookOpen } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { journalAPI } from '@/lib/api';

interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  emotionTags: string[];
  moodScore: number;
  inputMethod: string;
  analysis?: {
    sentiment: string;
    distressLevel: string;
    distressScore: number;
  };
  createdAt: string;
}

const distressColors: Record<string, string> = {
  none: '#26de81',
  mild: '#F7B731',
  moderate: '#FFA500',
  high: '#FC5C65',
};

const sentimentEmoji: Record<string, string> = {
  positive: '😊', negative: '😔', neutral: '😐', mixed: '🔄',
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetch = async (p = 1) => {
    setLoading(true);
    try {
      const res = await journalAPI.list(p, 10);
      const newEntries = res.data.journals;
      setEntries(p === 1 ? newEntries : prev => [...prev, ...newEntries]);
      setHasMore(res.data.pagination?.hasNext || false);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(1); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await journalAPI.delete(id);
      setEntries(prev => prev.filter(e => e._id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const filtered = entries.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-text-primary">Your Journal</h1>
            <p className="text-sm text-muted mt-1">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</p>
          </div>
          <Link
            href="/journal/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-body hover:bg-primary/90 transition-all"
          >
            <PenLine className="w-4 h-4" />
            New Entry
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your entries…"
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-white/10 rounded-xl text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        {/* Entries */}
        {loading && entries.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-card border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <BookOpen className="w-12 h-12 text-muted/30" />
            <div>
              <p className="text-text-primary font-body">No entries yet</p>
              <p className="text-sm text-muted">Your journal is waiting for your first thought.</p>
            </div>
            <Link href="/journal/new" className="text-sm text-primary hover:underline">
              Write your first entry →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry, i) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group rounded-2xl bg-card border border-white/10 hover:border-white/20 p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-body font-semibold text-text-primary truncate">{entry.title}</h3>
                      {entry.analysis && (
                        <span className="text-sm">{sentimentEmoji[entry.analysis.sentiment]}</span>
                      )}
                      {entry.inputMethod === 'voice' && (
                        <span className="text-xs text-muted bg-white/5 px-1.5 py-0.5 rounded">🎤 Voice</span>
                      )}
                    </div>

                    <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">
                      {entry.content}
                    </p>

                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs text-muted">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>

                      {entry.moodScore && (
                        <span className="text-xs text-muted bg-white/5 px-2 py-0.5 rounded-full">
                          Mood {entry.moodScore}/10
                        </span>
                      )}

                      {entry.analysis?.distressLevel && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            color: distressColors[entry.analysis.distressLevel],
                            backgroundColor: distressColors[entry.analysis.distressLevel] + '22',
                          }}
                        >
                          {entry.analysis.distressLevel} distress
                        </span>
                      )}

                      {entry.emotionTags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs text-muted bg-white/5 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(entry._id)}
                    disabled={deleting === entry._id}
                    className="p-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-danger/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}

            {hasMore && (
              <button
                onClick={() => fetch(page + 1)}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-white/10 text-muted text-sm hover:text-text-primary hover:border-white/20 transition-all"
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
