'use client';
import { motion } from 'framer-motion';
import { Heart, AlertTriangle } from 'lucide-react';

interface Props {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  flaggedForCrisis?: boolean;
  isLatest?: boolean;
}

export default function ChatBubble({ role, content, timestamp, flaggedForCrisis, isLatest }: Props) {
  const isUser = role === 'user';
  const time = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mt-1">
          <Heart className="w-3.5 h-3.5 text-primary" />
        </div>
      )}

      <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-primary/20 border border-primary/30 text-text-primary rounded-tr-sm'
              : flaggedForCrisis
              ? 'bg-danger/10 border border-danger/20 text-text-primary rounded-tl-sm'
              : 'bg-surface border border-white/10 text-text-primary/90 font-light italic rounded-tl-sm'
          }`}
        >
          {flaggedForCrisis && (
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-danger/20">
              <AlertTriangle className="w-3 h-3 text-danger" />
              <span className="text-xs text-danger font-normal not-italic">Crisis support resources shared</span>
            </div>
          )}
          {content}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted px-1">{time}</span>
      </div>
    </motion.div>
  );
}
