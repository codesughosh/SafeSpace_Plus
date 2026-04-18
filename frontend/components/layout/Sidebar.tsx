'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, MessageCircle, BarChart3,
  Settings, Sparkles, LogOut, Menu, X, Heart,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useMood } from '@/context/MoodContext';
import { getDailyQuote } from '@/lib/getDailyQuote';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/journal',   icon: BookOpen,        label: 'Journal' },
  { href: '/chat',      icon: MessageCircle,   label: 'Let\'s Talk' },
  { href: '/insights',  icon: BarChart3,       label: 'Insights' },
  { href: '/settings',  icon: Settings,        label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { todayMood } = useMood();
  const distressScore = todayMood !== null ? 100 - todayMood : 50;
  const [quote, setQuote] = useState("");

  useEffect(() => {
  if (distressScore !== undefined) {
    setQuote(getDailyQuote(distressScore));
  }
}, [distressScore]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 mb-10 px-2">
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
          <Heart className="w-4 h-4 text-primary" />
        </div>
        <div>
          <span className="font-display text-lg text-text-primary">SafeSpace</span>
          <span className="text-primary font-display text-lg">+</span>
        </div>
      </Link>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm
                transition-all duration-200 group
                ${active
                  ? 'bg-primary/15 text-text-primary border border-primary/30'
                  : 'text-muted hover:text-text-primary hover:bg-white/5'
                }
              `}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 relative z-10 transition-colors ${active ? 'text-primary' : 'group-hover:text-primary'}`} />
              <span className="relative z-10">{label}</span>
              {active && <div className="absolute right-3 w-1 h-1 rounded-full bg-primary z-10" />}
            </Link>
          );
        })}
      </nav>

      {/* AI Tip badge */}
      <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-3 h-3 text-accent" />
          <span className="text-xs text-muted font-body">Daily reminder</span>
        </div>
        <p className="text-xs text-text-primary/80 font-body leading-relaxed">
  {quote || "Loading..."}
</p>
      </div>

      {/* User + Logout */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-body font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body text-text-primary truncate">{user?.name}</p>
            <p className="text-xs text-muted capitalize">{user?.persona || 'general'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-danger hover:bg-danger/10 transition-all duration-200 text-sm font-body"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-surface/80 backdrop-blur-xl border-r border-white/5 fixed left-0 top-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-xl border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          <span className="font-display text-lg">SafeSpace<span className="text-primary">+</span></span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-muted hover:text-text-primary">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-surface z-50 border-r border-white/10"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
