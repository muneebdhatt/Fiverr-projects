'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import type { Flag, Patient } from '@/data/types';
import { personaOf, useApp } from '@/lib/store';
import { clock, dayTime, waitLabel } from '@/lib/time';
import { Modal } from './ui';

const FLAG_COLOR: Record<Flag['level'], string> = { urgent: 'text-[#a03015]', review: 'text-[#8a6006]', info: 'text-[#473aa0]' };

/** Paper-style report. Always light so it reads the same on screen and in print. */
function ReportBody({ patients, kind, now }: { patients: Patient[]; kind: 'handover' | 'patient'; now: number }) {
  const role = useApp((s) => s.role);
  const by = personaOf(role).name;
  const groups = (['In review', 'Waiting', 'Seen'] as const).map((s) => ({ s, rows: patients.filter((p) => p.status === s) })).filter((g) => g.rows.length);
  const flagged = patients.filter((p) => p.flags.some((f) => f.level !== 'info')).length;

  return (
    <div className="bg-white text-[#1b1914]" style={{ fontFamily: "'Figtree Variable', system-ui, sans-serif" }}>
      <div className="flex items-start justify-between border-b-2 border-[#704f10] pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#704f10]">Fernway · Alder Street Health</p>
          <h3 className="mt-1 font-display text-3xl leading-none text-[#583e0c]">{kind === 'handover' ? 'Shift handover report' : 'Patient summary'}</h3>
        </div>
        <div className="text-right text-xs text-[#80796c]">
          <p>{dayTime(now)}</p>
          <p>Prepared by {by}</p>
        </div>
      </div>

      {kind === 'handover' && (
        <div className="my-4 grid grid-cols-4 gap-3 text-center">
          {[['Checked in', patients.length], ['In review', patients.filter((p) => p.status === 'In review').length], ['Still waiting', patients.filter((p) => p.status === 'Waiting').length], ['Flagged', flagged]].map(([k, v]) => (
            <div key={k as string} className="rounded-lg border border-[#e0d4b8] bg-[#fdfcf8] py-2.5">
              <p className="font-display text-3xl leading-none text-[#583e0c]">{v}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#80796c]">{k}</p>
            </div>
          ))}
        </div>
      )}

      {groups.map((g) => (
        <section key={g.s} className="mt-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#80796c]">{g.s} ({g.rows.length})</p>
          <div className="divide-y divide-[#f0e9d7] rounded-lg border border-[#e0d4b8]">
            {g.rows.map((p) => (
              <div key={p.id} className="break-inside-avoid px-3.5 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold">{p.name} <span className="font-normal text-[#80796c]">· {p.age} {p.sex} · {p.reason}</span></p>
                  <p className="text-xs text-[#80796c]">Arrived {clock(p.arrivedAt)} · {p.status === 'Seen' ? 'Seen' : `waiting ${waitLabel(((p.status === 'Waiting' ? now : p.startedAt ?? now) - p.arrivedAt) / 60000)}`} · {p.clinician}</p>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#48443c]">{p.summary}</p>
                {p.flags.length > 0 && (
                  <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs font-semibold">
                    {p.flags.map((f, i) => <li key={i} className={FLAG_COLOR[f.level]}>• {f.text}</li>)}
                  </ul>
                )}
                {p.notes[0] && <p className="mt-1.5 border-l-2 border-[#e8d08c] pl-2.5 text-xs italic text-[#625d52]">Note, {p.notes[0].by}: {p.notes[0].text}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="mt-5 border-t border-[#f0e9d7] pt-3 text-[10px] text-[#a09a8c]">Contains confidential patient information. Generated from check-in answers and clinician notes. Access to this report is recorded in the audit trail.</p>
    </div>
  );
}

export function ReportModal({ open, onClose, patients, kind, label }: { open: boolean; onClose: () => void; patients: Patient[]; kind: 'handover' | 'patient'; label: string }) {
  const logExport = useApp((s) => s.logExport);
  const toast = useApp((s) => s.toast);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (open) setNow(Date.now());
  }, [open]);

  return (
    <>
      <Modal open={open} onClose={onClose} title={kind === 'handover' ? 'Handover report' : 'Patient summary'} width="max-w-3xl">
        <div className="scroll-thin max-h-[62vh] overflow-y-auto rounded-xl border border-bone-300 bg-white p-5 shadow-inner">
          <ReportBody patients={patients} kind={kind} now={now} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Close</button>
          <button
            className="btn-primary"
            onClick={() => {
              logExport(label);
              toast('Report ready, choose Save as PDF in the print window');
              setTimeout(() => window.print(), 300);
            }}
          >
            <Printer size={15} />Download PDF
          </button>
        </div>
      </Modal>
      {open && typeof document !== 'undefined' && createPortal(<div className="print-only"><ReportBody patients={patients} kind={kind} now={now} /></div>, document.body)}
    </>
  );
}
