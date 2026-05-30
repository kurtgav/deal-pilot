import { create } from 'zustand';
import type { TranscriptLine, ExtractedSalesFields } from '@dealpilot/shared';

export type SpeechRate = 1 | 1.5 | 2;
export const SPEECH_RATES: SpeechRate[] = [1, 1.5, 2];

const SPEECH_RATE_KEY = 'dealpilot.speechRate';

function loadSpeechRate(): SpeechRate {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = window.localStorage.getItem(SPEECH_RATE_KEY);
    if (!raw) return 1;
    const n = Number(raw);
    return (SPEECH_RATES as number[]).includes(n) ? (n as SpeechRate) : 1;
  } catch {
    return 1;
  }
}

function persistSpeechRate(rate: SpeechRate): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SPEECH_RATE_KEY, String(rate));
  } catch {
    /* ignore quota / private mode */
  }
}

interface SessionState {
  transcript: TranscriptLine[];
  fields: ExtractedSalesFields;
  score: number;
  muted: boolean;
  speechRate: SpeechRate;
  lastLatencyMs: number | null;
  addTranscriptLine: (line: TranscriptLine) => void;
  updateFields: (delta: Partial<ExtractedSalesFields>) => void;
  setScore: (score: number) => void;
  setMuted: (muted: boolean) => void;
  setSpeechRate: (rate: SpeechRate) => void;
  setLatency: (ms: number) => void;
  reset: () => void;
}

const emptyFields: ExtractedSalesFields = { painPoints: [], objections: [], unansweredQuestions: [] };

export const useSessionStore = create<SessionState>((set) => ({
  transcript: [],
  fields: { ...emptyFields },
  score: 0,
  muted: false,
  speechRate: loadSpeechRate(),
  lastLatencyMs: null,
  addTranscriptLine: (line) => set((s) => ({ transcript: [...s.transcript, line] })),
  updateFields: (delta) => set((s) => ({
    fields: {
      ...s.fields,
      ...delta,
      painPoints: delta.painPoints ? [...s.fields.painPoints, ...delta.painPoints] : s.fields.painPoints,
      objections: delta.objections ? [...s.fields.objections, ...delta.objections] : s.fields.objections,
      unansweredQuestions: delta.unansweredQuestions ? [...s.fields.unansweredQuestions, ...delta.unansweredQuestions] : s.fields.unansweredQuestions,
    },
  })),
  setScore: (score) => set({ score }),
  setMuted: (muted) => set({ muted }),
  setSpeechRate: (rate) => {
    persistSpeechRate(rate);
    set({ speechRate: rate });
  },
  setLatency: (ms) => set({ lastLatencyMs: ms }),
  // reset preserves speechRate (it's a user preference, not call state)
  reset: () => set((s) => ({ transcript: [], fields: { ...emptyFields }, score: 0, muted: false, lastLatencyMs: null, speechRate: s.speechRate })),
}));
