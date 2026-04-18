'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { chatAPI } from '@/lib/api';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  flaggedForCrisis?: boolean;
}

interface ChatSession {
  _id: string;
  title: string;
  messageCount: number;
  sessionSentiment?: string;
  distressScore?: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: Message[];
  crisisDetected: boolean;
  sending: boolean;
  fetchSessions: () => Promise<void>;
  startNewSession: () => Promise<string>;
  loadSession: (id: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  dismissCrisis: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await chatAPI.sessions();
      setSessions(res.data.sessions);
    } catch (e) { console.error(e); }
  };

  const startNewSession = async (): Promise<string> => {
    const res = await chatAPI.createSession();
    const session = res.data.session;
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session._id);
    setMessages([]);
    setCrisisDetected(false);
    return session._id;
  };

  const loadSession = async (id: string) => {
    const res = await chatAPI.getSession(id);
    setActiveSessionId(id);
    setMessages(res.data.session.messages || []);
    setCrisisDetected(false);
  };

  const sendMessage = async (text: string) => {
    if (!activeSessionId || !text.trim()) return;
    setSending(true);

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await chatAPI.sendMessage({ message: text, sessionId: activeSessionId });
      const { reply, crisisDetected: crisis } = res.data;
      if (crisis) setCrisisDetected(true);

      const aiMsg: Message = {
        role: 'model',
        content: reply,
        timestamp: new Date().toISOString(),
        flaggedForCrisis: crisis,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Update session list title
      setSessions((prev) =>
        prev.map((s) =>
          s._id === activeSessionId
            ? { ...s, ...res.data.session, messageCount: res.data.session.messageCount }
            : s
        )
      );
    } catch (e: unknown) {
      const errorMsg: Message = {
        role: 'model',
        content: 'I had trouble connecting. Please try again in a moment.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const dismissCrisis = () => setCrisisDetected(false);

  return (
    <ChatContext.Provider value={{
      sessions, activeSessionId, messages, crisisDetected, sending,
      fetchSessions, startNewSession, loadSession, sendMessage, dismissCrisis,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
