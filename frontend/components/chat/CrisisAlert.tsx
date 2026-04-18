'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Phone, X, ExternalLink } from 'lucide-react';

const resources = [
  { name: 'iCall', number: '9152987821', url: 'https://icallhelpline.org', desc: 'Mon–Sat, 8am–10pm' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', url: 'https://www.vandrevalafoundation.com', desc: '24/7 helpline' },
  { name: 'iMind', number: '080-46110007', url: 'https://imindyourself.com', desc: 'Online therapy' },
  { name: 'NIMHANS', number: '080-46110007', url: 'https://nimhans.ac.in', desc: 'National institute' },
];

interface Props {
  onDismiss?: () => void;
}

export default function CrisisAlert({ onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl bg-danger/10 border border-danger/30 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Heart className="w-4 h-4 text-danger" />
              </div>
              <div>
                <h3 className="text-sm font-body font-semibold text-text-primary mb-1">
                  You're not alone. Immediate support is available.
                </h3>
                <p className="text-xs text-muted mb-3">
                  It sounds like you're going through something heavy. Please reach out — trained counsellors are here to help.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {resources.map(r => (
                    <a
                      key={r.name}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      <Phone className="w-3 h-3 text-danger flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-body font-medium text-text-primary truncate">{r.name}</p>
                        <p className="text-xs text-muted">{r.number} · {r.desc}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>

                <p className="text-xs text-muted mt-2 italic">
                  These resources are confidential and free. You deserve support. 💙
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 text-muted hover:text-text-primary transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
