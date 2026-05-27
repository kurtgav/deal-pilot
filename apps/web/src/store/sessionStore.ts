import { create } from 'zustand';
import type { TranscriptLine, ExtractedSalesFields } from '@dealpilot/shared';

interface SessionState {
  transcript: TranscriptLine[];
  fields: ExtractedSalesFields;
  score: number;
  muted: boolean;
  addTranscriptLine: (line: TranscriptLine) => void;
  updateFields: (delta: Partial<ExtractedSalesFields>) => void;
  setScore: (score: number) => void;
  setMuted: (muted: boolean) => void;
  reset: () => void;
}

const emptyFields: ExtractedSalesFields = { painPoints: [], objections: [], unansweredQuestions: [] };

export const useSessionStore = create<SessionState>((set) => ({
  transcript: [],
  fields: { ...emptyFields },
  score: 0,
  muted: false,
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
  reset: () => set({ transcript: [], fields: { ...emptyFields }, score: 0, muted: false }),
}));
