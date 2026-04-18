'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInputButton({ onTranscript, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
               (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const recognition = new (SR as new () => SpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interimText += t;
      }
      if (final) onTranscript(final);
      setInterim(interimText);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => { setListening(false); setInterim(''); };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted">
        <AlertCircle className="w-4 h-4" />
        <span>Voice input not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 disabled:opacity-50 ${
          listening
            ? 'bg-danger/20 border-2 border-danger text-danger'
            : 'bg-white/5 border border-white/20 text-muted hover:text-primary hover:border-primary/50'
        }`}
      >
        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}

        {/* Pulse rings when listening */}
        {listening && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-danger animate-ping opacity-40" />
            <span className="absolute inset-[-4px] rounded-full border border-danger/30 animate-pulse" />
          </>
        )}
      </button>

      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="flex items-center gap-2"
          >
            <span className="flex gap-0.5">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-danger"
                  animate={{ height: ['4px', '12px', '4px'] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </span>
            <span className="text-xs text-danger font-body">Listening…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {interim && (
        <span className="text-xs text-muted italic truncate max-w-32">{interim}</span>
      )}
    </div>
  );
}
