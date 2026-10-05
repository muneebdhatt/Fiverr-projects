import type { Doc } from '@/data/types';

const sentences = (t: string) => t.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [];

/** Builds a document plus deterministic prepared AI answers from what the user typed. */
export function buildDoc(orgId: string, authorId: string, title: string, kind: string, text: string): Doc {
  const paras = text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  const body = paras.length ? paras : ['This document is ready for your first draft.'];
  const ss = sentences(text);
  const lead = ss.slice(0, 2).join(' ');
  const verbs = /\b(send|review|confirm|book|schedule|update|prepare|share|draft|approve|follow up|call|finish)\b/i;
  const found = ss.filter((s) => verbs.test(s)).slice(0, 3).map((s) => s.replace(/[.!?]$/, ''));
  const actions = found.length ? found : [`Review the ${title.toLowerCase()} with the team`, 'Share it with the people who need it', 'Confirm the next steps and owners'];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    id: `new-${Date.now()}`, orgId, title, kind, authorId, updatedMins: 0, createdMins: 0, words, body,
    summary: lead ? `${title}: ${lead}` : `${title} is a new ${kind.toLowerCase()} that has not been written up yet.`,
    actions,
    rewrite: ss[0] ? `${ss[0].replace(/[.!?]$/, '')}. In short, keep it clear and move on to the next step.` : `A clearer version of ${title} will appear once there is text to work with.`,
    es: `Este documento, «${title}», resume los puntos principales para el equipo. Se recomienda revisarlo, compartirlo y confirmar los siguientes pasos.`,
  };
}
