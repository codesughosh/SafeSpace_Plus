'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Briefcase, Leaf, ChevronRight, ChevronLeft, Shield, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/lib/api';

type Persona = 'student' | 'professional' | 'general';

const INTAKE_QUESTIONS = [
  { id: 'q1', text: 'How often have you felt down or hopeless in the past week?', emoji: ['😊', '🙂', '😐', '😔', '😢'] },
  { id: 'q2', text: 'How would you rate your stress level right now?', emoji: ['😌', '🙂', '😤', '😰', '🤯'] },
  { id: 'q3', text: 'How has your sleep quality been lately?', emoji: ['😴', '🛌', '😐', '😵', '🥱'] },
  { id: 'q4', text: 'Do you have someone you can talk to when feeling low?', emoji: ['💛', '🙂', '😐', '😕', '💔'] },
  { id: 'q5', text: "What brings you to SafeSpace+ today?", emoji: ['🌱', '💪', '🤔', '😔', '🆘'] },
];

const PERSONAS = [
  {
    id: 'student' as Persona,
    icon: GraduationCap,
    title: 'Student',
    emoji: '🎓',
    desc: 'Academic stress, exams, social pressure',
    color: 'from-primary/20 to-primary/5',
    border: 'border-primary/40',
    glow: 'shadow-glow-primary',
  },
  {
    id: 'professional' as Persona,
    icon: Briefcase,
    title: 'Young Professional',
    emoji: '💼',
    desc: 'Work stress, burnout, deadlines',
    color: 'from-secondary/20 to-secondary/5',
    border: 'border-secondary/40',
    glow: 'hover:shadow-glow-secondary',
  },
  {
    id: 'general' as Persona,
    icon: Leaf,
    title: 'General Wellness',
    emoji: '🌿',
    desc: 'Everyday wellness, no specific context',
    color: 'from-success/20 to-success/5',
    border: 'border-success/40',
    glow: 'hover:shadow-[0_0_20px_rgba(38,222,129,0.3)]',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(0); // 0 = persona, 1 = intake, 2 = privacy
  const [persona, setPersona] = useState<Persona | null>(null);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePersonaSelect = (p: Persona) => {
    setPersona(p);
    setTimeout(() => setStep(1), 300);
  };

  const handleResponse = (qId: string, val: number) => {
    setResponses((prev) => ({ ...prev, [qId]: val }));
  };

  const allAnswered = INTAKE_QUESTIONS.every((q) => responses[q.id]);

  const handleFinish = async () => {
    if (!persona || !consent) return;
    setLoading(true);
    setError('');
    try {
      const formattedResponses = INTAKE_QUESTIONS.map((q) => ({
        question: q.text,
        answer: responses[q.id] || 3,
      }));
      await userAPI.onboarding({ persona, responses: formattedResponses, privacyConsent: true });
      await refreshUser();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="ambient-orb w-96 h-96 bg-primary/10 top-[-6rem] right-[-6rem]" />
      <div className="ambient-orb w-72 h-72 bg-secondary/8 bottom-0 left-0" style={{ animationDelay: '4s' }} />

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? 'w-12 bg-primary' : i < step ? 'w-8 bg-primary/40' : 'w-8 bg-white/10'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0 — Persona */}
          {step === 0 && (
            <motion.div
              key="persona"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-display text-4xl text-text-primary mb-3">
                  Who are you today?
                </h2>
                <p className="text-muted font-body">
                  This helps us personalise your experience. You can change it anytime.
                </p>
              </div>

              <div className="grid gap-4">
                {PERSONAS.map(({ id, icon: Icon, title, emoji, desc, color, border }) => (
                  <motion.button
                    key={id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePersonaSelect(id)}
                    className={`
                      relative p-6 rounded-2xl bg-gradient-to-br ${color}
                      border ${border} text-left w-full
                      hover:shadow-card transition-all duration-300
                      ${persona === id ? 'ring-2 ring-primary/60' : ''}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{emoji}</div>
                      <div>
                        <p className="font-body font-semibold text-text-primary text-lg">{title}</p>
                        <p className="font-body text-muted text-sm mt-0.5">{desc}</p>
                      </div>
                      <ChevronRight className="ml-auto text-muted w-5 h-5" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1 — Intake Questions */}
          {step === 1 && (
            <motion.div
              key="intake"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl text-text-primary mb-3">
                  A quick check-in
                </h2>
                <p className="text-muted font-body text-sm">
                  5 questions to help us understand where you are right now.
                  No right or wrong answers.
                </p>
              </div>

              <div className="glass-card p-6 space-y-6">
                {INTAKE_QUESTIONS.map((q, qi) => (
                  <div key={q.id}>
                    <p className="font-body text-text-primary text-sm mb-3">
                      <span className="text-muted mr-2">{qi + 1}.</span>{q.text}
                    </p>
                    <div className="flex gap-2 justify-between">
                      {q.emoji.map((em, i) => (
                        <button
                          key={i}
                          onClick={() => handleResponse(q.id, i + 1)}
                          className={`
                            flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border text-lg
                            transition-all duration-200 font-body
                            ${responses[q.id] === i + 1
                              ? 'border-primary/60 bg-primary/15 scale-110'
                              : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                            }
                          `}
                        >
                          <span>{em}</span>
                          <span className="text-[10px] text-muted">{i + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="btn-ghost flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!allAnswered}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Privacy */}
          {step === 2 && (
            <motion.div
              key="privacy"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success/20 border border-success/40 mb-4">
                  <Shield className="w-7 h-7 text-success" />
                </div>
                <h2 className="font-display text-3xl text-text-primary mb-3">
                  Your privacy matters
                </h2>
                <p className="text-muted font-body text-sm">
                  Before you begin, here's exactly what we do (and don't do) with your data.
                </p>
              </div>

              <div className="glass-card p-6 space-y-4 mb-6">
                {[
                  { icon: '📝', title: 'What we store', desc: 'Your journal entries, mood logs, and chat messages — securely in your account.' },
                  { icon: '🔒', title: 'What we never share', desc: 'Your data is never sold, shared with third parties, or used for advertising. Ever.' },
                  { icon: '🗑️', title: 'Your right to delete', desc: 'You can permanently delete all your data at any time from Settings. No questions asked.' },
                  { icon: '🤖', title: 'AI usage', desc: 'AI responses are for support only — not medical advice. Crisis detection will always show human helpline resources.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-body font-semibold text-text-primary text-sm">{item.title}</p>
                      <p className="font-body text-muted text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-body mb-4">
                  {error}
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                <div
                  onClick={() => setConsent(!consent)}
                  className={`
                    w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5
                    transition-all duration-200 cursor-pointer
                    ${consent ? 'bg-primary border-primary' : 'border-white/30 bg-white/5'}
                  `}
                >
                  {consent && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="font-body text-sm text-muted leading-relaxed">
                  I understand how my data is used and I consent to SafeSpace+ storing my wellness data to power my personal experience.
                </span>
              </label>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!consent || loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Enter SafeSpace+ <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
