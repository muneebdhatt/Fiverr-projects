'use client';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Compass, KeyRound, LogOut, Moon, Palette, Sun, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { usePrefs } from '@/lib/prefs';
import { useSession } from '@/shell/session';
import { toast } from '@/shell/Toast';
import { useTour } from '@/shell/Tour';
import { Avatar, PageHeader } from '@/shell/ui';

function Section({ icon: Icon, title, text, children }: { icon: typeof UserRound; title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-[18px] w-[18px]" /></div>
        <div><h2 className="text-base font-semibold">{title}</h2><p className="text-sm text-ink-500">{text}</p></div>
      </div>
      {children}
    </section>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={clsx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-brand-600' : 'bg-ink-300')}>
      <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const startTour = useTour((s) => s.start);
  const { me, setMe } = useSession();
  const { theme, setTheme, emailDigest, uploadAlerts, set } = usePrefs();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => { if (me) { setName(me.name); setTitle(me.title); } }, [me]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setMe(await api.updateMe(name, title));
      toast('Profile updated');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save your profile', 'err');
    } finally { setSaving(false); }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwBusy(true);
    setPwError('');
    try {
      await api.changePassword(cur, next);
      setCur(''); setNext('');
      toast('Password changed');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not change the password');
    } finally { setPwBusy(false); }
  };

  const signOutEverywhere = async () => {
    try { await api.signout(); } catch {}
    localStorage.removeItem('lk_in');
    router.replace('/login');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Settings" subtitle="Your profile, security and how Lorekeeper looks and notifies you." />

      <Section icon={UserRound} title="Profile" text="This is how teammates see you.">
        <div className="mb-4 flex items-center gap-3">
          {me && <Avatar name={me.name} size={48} />}
          <div className="min-w-0"><div className="truncate font-medium">{me?.name}</div><div className="truncate text-sm text-ink-500">{me?.email}</div></div>
        </div>
        <form onSubmit={saveProfile} className="space-y-3">
          <label className="block text-sm font-medium">Full name
            <input className="input mt-1.5" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </label>
          <label className="block text-sm font-medium">Job title
            <input className="input mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
          </label>
          <label className="block text-sm font-medium">Email
            <input className="input mt-1.5 opacity-70" value={me?.email ?? ''} readOnly />
          </label>
          <button className="btn-primary" disabled={saving || name.trim().length < 2 || (name === me?.name && title === me?.title)}>Save changes</button>
        </form>
      </Section>

      <Section icon={KeyRound} title="Password" text="Use at least 8 characters.">
        {me?.can_change_password ? (
          <form onSubmit={savePassword} className="space-y-3">
            <label className="block text-sm font-medium">Current password
              <input className="input mt-1.5" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
            </label>
            <label className="block text-sm font-medium">New password
              <input className="input mt-1.5" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </label>
            {pwError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwError}</div>}
            <button className="btn-primary" disabled={pwBusy || !cur || next.length < 8}>Change password</button>
          </form>
        ) : (
          <p className="rounded-lg bg-ink-50 px-3 py-2.5 text-sm text-ink-600">The password for this account is managed by your workspace administrator.</p>
        )}
      </Section>

      <Section icon={Palette} title="Appearance" text="Choose a light or dark look.">
        <div className="grid grid-cols-2 gap-3">
          {([['light', 'Light', Sun], ['dark', 'Dark', Moon]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTheme(key)} aria-pressed={theme === key} className={clsx('flex items-center gap-3 rounded-lg border p-3 text-left transition', theme === key ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-ink-200 hover:bg-ink-50')}>
              <Icon className="h-5 w-5 text-brand-600" /><span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Notifications" text="Choose what Lorekeeper tells you about.">
        <div className="divide-y divide-ink-100">
          <div className="flex items-center justify-between gap-4 pb-3">
            <div><div className="text-sm font-medium">Upload alerts</div><div className="text-xs text-ink-500">Show a message when a document is ready to search.</div></div>
            <Toggle on={uploadAlerts} onChange={(v) => { set({ uploadAlerts: v }); toast(v ? 'Upload alerts on' : 'Upload alerts off'); }} label="Upload alerts" />
          </div>
          <div className="flex items-center justify-between gap-4 pt-3">
            <div><div className="text-sm font-medium">Weekly email summary</div><div className="text-xs text-ink-500">A Monday recap of new documents and questions.</div></div>
            <Toggle on={emailDigest} onChange={(v) => { set({ emailDigest: v }); toast(v ? 'Weekly summary on' : 'Weekly summary off'); }} label="Weekly email summary" />
          </div>
        </div>
      </Section>

      <Section icon={Compass} title="Product tour" text="A short walk through asking questions, documents, drafts and admin tools.">
        <button className="btn-ghost" onClick={startTour}><Compass className="h-4 w-4" /> Take a tour</button>
      </Section>

      <Section icon={LogOut} title="Sessions" text="Sign out of Lorekeeper on this browser.">
        <button className="btn-ghost" onClick={signOutEverywhere}><LogOut className="h-4 w-4" /> Sign out</button>
      </Section>
    </div>
  );
}
