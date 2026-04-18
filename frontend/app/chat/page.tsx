'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, MessageCircle, Clock, ChevronRight, Heart, Loader2, Sparkles } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import CrisisAlert from '@/components/chat/CrisisAlert';
import { useChat } from '@/context/ChatContext';
import EmotionCamera from "@/components/camera/EmotionCamera";

const STARTERS = [
  "I've been feeling really stressed lately…",
  "I'm having trouble sleeping and I don't know why.",
  "I feel overwhelmed and don't know where to start.",
  "I just need someone to talk to right now.",
  "Can you help me with a breathing exercise?",
];

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
        <Heart className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="px-4 py-3 bg-surface border border-white/10 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const {
    sessions, activeSessionId, messages, crisisDetected, sending,
    fetchSessions, startNewSession, loadSession, sendMessage, dismissCrisis,
  } = useChat();

  const [starting, setStarting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [emotion, setEmotion] = useState<string | null>(null);

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleNew = async () => {
    setStarting(true);
    try { await startNewSession(); }
    finally { setStarting(false); setSidebarOpen(false); }
  };

  const handleSend = (text: string) => {
  const finalMessage = emotion
    ? `[User emotion: ${emotion}] ${text}`
    : text;

  sendMessage(finalMessage);
};

  const isEmpty = !activeSessionId;

  return (
    <AppLayout>
      <div className="flex gap-0 lg:gap-6 h-[calc(100vh-8rem)] -mx-4 lg:mx-0 -mt-4 lg:mt-0">

        {/* Sessions sidebar */}
        <aside className={`
          ${sidebarOpen ? 'flex' : 'hidden'} lg:flex flex-col
          w-full lg:w-64 flex-shrink-0
          bg-card lg:bg-transparent border-r lg:border-r-0 border-white/5
          absolute lg:relative inset-0 lg:inset-auto z-10 lg:z-auto
          lg:rounded-2xl lg:border lg:border-white/10
          overflow-hidden
        `}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-body font-semibold text-text-primary">Conversations</h2>
            <button
              onClick={handleNew}
              disabled={starting}
              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
              title="New conversation"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No conversations yet</p>
            ) : (
              sessions.map(s => (
                <button
                  key={s._id}
                  onClick={() => { loadSession(s._id); setSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group ${
                    activeSessionId === s._id
                      ? 'bg-primary/15 border border-primary/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MessageCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                      activeSessionId === s._id ? 'text-primary' : 'text-muted'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body text-text-primary truncate">
                        {s.title || 'New conversation'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-muted" />
                        <span className="text-xs text-muted">
                          {new Date(s.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-card rounded-none lg:rounded-2xl border-0 lg:border border-white/10 overflow-hidden min-w-0">

          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 bg-surface/50 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-muted hover:text-text-primary"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-body font-semibold text-text-primary">SafeSpace+ Companion</p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                Here for you
              </p>
            </div>

            {!activeSessionId && (
              <button
                onClick={handleNew}
                disabled={starting}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs hover:bg-primary/25 transition-all disabled:opacity-50"
              >
                {starting ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                New chat
              </button>
            )}
          </div>

          {/* Crisis alert */}
          <AnimatePresence>
            {crisisDetected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex-shrink-0"
              >
                <div className="p-3">
                  <CrisisAlert onDismiss={dismissCrisis} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-display text-text-primary mb-1">Let's talk</h3>
                  <p className="text-sm text-muted max-w-xs leading-relaxed">
                    I'm here to listen, reflect, and support you. Everything stays between us.
                  </p>
                </div>

                <div className="w-full max-w-sm space-y-2">
                  <p className="text-xs text-muted flex items-center gap-1.5 justify-center">
                    <Sparkles className="w-3 h-3 text-accent" />
                    Start with something like…
                  </p>
                  {STARTERS.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      onClick={async () => {
                        let sid = activeSessionId;
                        if (!sid) {
                          setStarting(true);
                          sid = await startNewSession();
                          setStarting(false);
                        }
                        sendMessage(s);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl bg-surface border border-white/10 hover:border-primary/30 text-sm text-muted hover:text-text-primary transition-all"
                    >
                      "{s}"
                    </motion.button>
                  ))}
                </div>

                <button
                  onClick={handleNew}
                  disabled={starting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  Start a conversation
                </button>
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted italic font-light">
                      This is a safe space. Share whatever feels right. 💙
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <ChatBubble
                    key={i}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    flaggedForCrisis={msg.flaggedForCrisis}
                    isLatest={i === messages.length - 1}
                  />
                ))}

                {sending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="p-3 border-t border-white/10">
  <EmotionCamera onEmotionDetected={setEmotion} />
  {emotion && (
    <p className="text-xs text-indigo-400 text-center mt-1">
      Current mood: {emotion}
    </p>
  )}
</div>

          {/* Input */}
          {(activeSessionId || !isEmpty) && (
            <ChatInput onSend={handleSend} disabled={sending || starting || !activeSessionId} />
          )}
          {!activeSessionId && isEmpty && (
            <div className="p-4 border-t border-white/5">
              <ChatInput onSend={async (text) => {
                const sid = await startNewSession();
                sendMessage(text);
              }} disabled={sending || starting} />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
