'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, Trash2, Download, Lock, Eye, Heart,
  AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronUp,
  Save
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/lib/api';

const PERSONAS = [
  { value: 'student', emoji: '🎓', label: 'Student', desc: 'Academic stress, exams, social pressure' },
  { value: 'professional', emoji: '💼', label: 'Professional', desc: 'Work stress, burnout, deadlines' },
  { value: 'general', emoji: '🌿', label: 'General', desc: 'Everyday wellness, no specific context' },
];

const ETHICS = [
  { icon: Heart, title: 'Companion, not a clinician', body: 'SafeSpace+ uses AI to support, not replace, professional mental health care. AI responses are not medical advice.' },
  { icon: Lock, title: 'Your data is protected', body: 'Your data is encrypted at rest and in transit. It is never sold, shared with advertisers, or used to train models without consent.' },
  { icon: Shield, title: 'Crisis detection is transparent', body: 'When distress signals are detected in your messages, you will always be shown human helpline resources immediately.' },
  { icon: Eye, title: 'You are always in control', body: 'You can download or delete all your data at any time. Disabling personalisation stops AI from using your history.' },
];

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-white/10 overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-body font-semibold text-text-primary">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-white/5 pt-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl z-50 text-sm font-body ${
        type === 'success'
          ? 'bg-success/15 border border-success/30 text-success'
          : 'bg-danger/15 border border-danger/30 text-danger'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {message}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [persona, setPersona] = useState(user?.persona || 'general');
  const [allowPersonalization, setAllowPersonalization] = useState(
    user?.preferences?.allowPersonalization ?? true
  );

  const [profileLoading, setProfileLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      await userAPI.updateProfile({ name, persona });
      await userAPI.updatePreferences({ allowPersonalization });
      await refreshUser();
      showToast('Profile updated successfully');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await userAPI.export();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safespace-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully');
    } catch {
      showToast('Failed to export data', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      await userAPI.deleteData();
      await logout();
    } catch {
      showToast('Failed to delete data', 'error');
      setDeleteLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display text-text-primary">Settings</h1>
          <p className="text-sm text-muted mt-1">Manage your profile, privacy, and data</p>
        </motion.div>

        {/* Profile */}
        <Section title="Profile" icon={User}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1.5">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-sm text-text-primary outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 bg-surface/50 border border-white/5 rounded-xl text-sm text-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-2">Persona</label>
              <div className="grid grid-cols-3 gap-3">
                {PERSONAS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPersona(p.value as 'student' | 'professional' | 'general')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      persona === p.value
                        ? 'bg-primary/15 border-primary/40 text-text-primary'
                        : 'bg-surface border-white/10 text-muted hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl block mb-1">{p.emoji}</span>
                    <p className="text-xs font-body font-medium">{p.label}</p>
                    <p className="text-xs mt-0.5 opacity-60 leading-tight">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={profileLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm hover:bg-primary/25 transition-all disabled:opacity-50"
            >
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </Section>

        {/* Privacy & Data */}
        <Section title="Privacy & Data Controls" icon={Shield}>
          <div className="space-y-4">
            {/* Personalisation toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/5">
              <div className="flex-1 pr-4">
                <p className="text-sm font-body text-text-primary">Allow AI personalisation</p>
                <p className="text-xs text-muted mt-0.5">Let AI use your journal history to tailor recommendations and responses</p>
              </div>
              <button
                onClick={() => setAllowPersonalization(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  allowPersonalization ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  allowPersonalization ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Export */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/5">
              <div>
                <p className="text-sm font-body text-text-primary">Download my data</p>
                <p className="text-xs text-muted mt-0.5">Export all journals, mood logs, and chat history as JSON</p>
              </div>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-xs hover:bg-secondary/20 transition-all disabled:opacity-50 flex-shrink-0"
              >
                {exportLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Export
              </button>
            </div>

            {/* Delete */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-danger/5 border border-danger/15">
              <div>
                <p className="text-sm font-body text-text-primary">Delete all my data</p>
                <p className="text-xs text-muted mt-0.5">Permanently removes all journals, moods, chats, and your account</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs hover:bg-danger/20 transition-all flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        </Section>

        {/* Ethics */}
        <Section title="Our Commitment to You" icon={Heart} defaultOpen={false}>
          <div className="space-y-3">
            {ETHICS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3 p-3 rounded-xl bg-surface border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-body font-semibold text-text-primary mb-0.5">{title}</p>
                  <p className="text-xs text-muted leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-card border border-white/10 rounded-2xl p-6 mx-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-danger/15 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                  </div>
                  <div>
                    <h3 className="text-base font-body font-semibold text-text-primary">Delete all data?</h3>
                    <p className="text-xs text-muted">This cannot be undone.</p>
                  </div>
                </div>

                <p className="text-sm text-muted leading-relaxed mb-4">
                  This will permanently delete your account, all journal entries, mood logs, and chat history. You will be logged out immediately.
                </p>

                <div className="mb-4">
                  <label className="text-xs text-muted block mb-1.5">
                    Type <span className="text-danger font-mono">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-sm text-text-primary outline-none focus:border-danger/40 transition-colors font-mono"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted text-sm hover:text-text-primary hover:border-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger/15 border border-danger/30 text-danger text-sm hover:bg-danger/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete everything
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </AppLayout>
  );
}
