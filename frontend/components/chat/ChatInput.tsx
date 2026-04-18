'use client';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, AlertCircle } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceEmotion, setVoiceEmotion] = useState<string>('neutral');

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 🎧 AUDIO ANALYSIS
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);

  // ✅ FIXED: Proper SpeechRecognition inside useEffect
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText(prev => (prev ? prev + ' ' + transcript : transcript));
    };

    rec.onend = () => {
  // 🔁 Restart automatically if still listening
  if (listening) {
    recognitionRef.current?.start();
  }
};

    rec.onerror = () => {
  console.log('Speech error, retrying...');
};

    recognitionRef.current = rec;

    return () => {
      stopAudioAnalysis();
    };
  }, []);

  // 📏 Auto resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  // 🎧 START AUDIO ANALYSIS
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      intervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);

        // 🔊 ENERGY
const energy =
  dataArray.reduce((a: number, b: number) => a + b, 0) /
  dataArray.length;

// 🎵 SPLIT FREQUENCIES
const half = Math.floor(dataArray.length / 2);

const lowFreq = dataArray.slice(0, half);
const highFreq = dataArray.slice(half);

// 🔻 LOW AVG
const lowAvg =
  lowFreq.reduce((a: number, b: number) => a + b, 0) /
  lowFreq.length;

// 🔺 HIGH AVG
const highAvg =
  highFreq.reduce((a: number, b: number) => a + b, 0) /
  highFreq.length;

// 🎯 PITCH
const pitch = highAvg - lowAvg;

// 🎭 EMOTION LOGIC
let emotion = 'neutral';

if (energy < 25 && pitch < 5) {
  emotion = 'sad';
} else if (energy > 70 && pitch > 10) {
  emotion = 'excited';
} else if (energy > 50 && pitch > 0) {
  emotion = 'happy';
} else if (energy > 60 && pitch < -5) {
  emotion = 'angry';
} else {
  emotion = 'neutral';
}

setVoiceEmotion(emotion);
      }, 500);
    } catch (err) {
      console.error('Audio access denied', err);
    }
  };

  // 🛑 STOP AUDIO ANALYSIS
  const stopAudioAnalysis = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // 🎤 Toggle mic
  const toggleVoice = () => {
  if (!recognitionRef.current) return;

  // 👉 FOCUS TEXTAREA when mic clicked
  textareaRef.current?.focus();

  if (listening) {
    recognitionRef.current.stop();
    setListening(false);
    stopAudioAnalysis();
  } else {
    recognitionRef.current.start();
    setListening(true);
    startAudioAnalysis();
  }
};

  // 📤 Send message
  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    const finalMessage =
      voiceEmotion !== 'neutral'
        ? `[User sounds ${voiceEmotion}] ${trimmed}`
        : trimmed;

    onSend(finalMessage);
    setText('');
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-white/5 bg-surface/50 backdrop-blur-sm">
      <div className="flex flex-col gap-1">

        {/* 🎧 Emotion Indicator */}
        {listening && (
          <p className="text-xs text-indigo-400 text-center">
            🎤 Voice mood: {voiceEmotion}
          </p>
        )}

        <div className="flex items-end gap-2 bg-card border border-white/10 rounded-2xl px-4 py-3 focus-within:border-primary/30 transition-colors">

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled}
            placeholder="Share what's on your mind…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-muted/40 outline-none resize-none leading-relaxed max-h-28"
          />

          <div className="flex items-center gap-2 pb-0.5">

            {/* 🎤 Mic */}
            {speechSupported ? (
              <button
                type="button"
                onClick={toggleVoice}
                className={`relative p-1.5 rounded-lg ${
                  listening
                    ? 'text-danger bg-danger/10'
                    : 'text-muted hover:text-primary'
                }`}
              >
                {listening ? <MicOff /> : <Mic />}
              </button>
            ) : (
              <AlertCircle />
            )}

            {/* 📤 Send */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!text.trim()}
              className="p-1.5 rounded-lg bg-primary/20 text-primary"
            >
              <Send />
            </motion.button>

          </div>
        </div>
      </div>
    </div>
  );
}