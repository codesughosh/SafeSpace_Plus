import type { Metadata } from 'next';
import { DM_Serif_Display, DM_Mono } from 'next/font/google';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { MoodProvider } from '@/context/MoodContext';
import { ChatProvider } from '@/context/ChatContext';

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'YouMatter | Your Mental Wellness Companion',
  description: 'A compassionate AI-powered mental wellness companion. Journal, track, reflect, and grow.',
  keywords: ['mental health', 'wellness', 'journaling', 'AI companion', 'mood tracking'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSerif.variable} ${poppins.variable} ${dmMono.variable}`}
    >
      <body
        className="antialiased"
        style={{
          fontFamily: 'var(--font-body, Poppins, sans-serif)',
          background: 'var(--bg)',
          color: 'var(--text)',
        }}
      >
        <AuthProvider>
          <MoodProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </MoodProvider>
        </AuthProvider>
      </body>
    </html>
  );
}