import { FileText, Languages, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from './ui';

/** The two-column frame shared by the sign-in and sign-up pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-500/30 blur-3xl" />
        <Logo light />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Write less. Say more. Keep every document moving.</h2>
          <p className="mt-4 text-brand-100">Quillstack gives small teams an AI workspace to summarise, rewrite and translate documents, with the roles and records a growing business needs.</p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15"><Sparkles size={18} /></span>Summaries and action items in seconds</li>
            <li className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15"><Languages size={18} /></span>Translate and rewrite in your team&apos;s voice</li>
            <li className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15"><ShieldCheck size={18} /></span>Separate workspaces, roles and a full audit log</li>
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-brand-200"><FileText size={14} />Trusted by studios, firms and agencies</p>
      </div>
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          {children}
          <p className="mt-8 text-center text-xs text-ink-400">© 2026 Quillstack, Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
