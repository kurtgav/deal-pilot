import { describe, it, expect, vi } from 'vitest';
import type { TranscriptLine } from '@dealpilot/shared';

// Mock the LLM so the test is deterministic and offline.
const callLLM = vi.fn();
vi.mock('./AIAgent.js', () => ({ callLLM: (...a: any[]) => callLLM(...a) }));

const { extractFields } = await import('./FieldExtractor.js');

const transcript: TranscriptLine[] = [
  { speaker: 'AI', text: 'What are you working on?', timestamp: '' },
  { speaker: 'PROSPECT', text: 'Live tutoring voice rooms, fairly urgent.', timestamp: '' },
];
const base = { painPoints: [], objections: [], unansweredQuestions: [] };

describe('FieldExtractor', () => {
  it('parses a clean JSON delta', async () => {
    callLLM.mockResolvedValueOnce('{"delta":{"useCase":"Live tutoring voice rooms","urgency":"High"}}');
    const delta = await extractFields(transcript, base);
    expect(delta).toEqual({ useCase: 'Live tutoring voice rooms', urgency: 'High' });
  });

  it('strips markdown code fences before parsing', async () => {
    callLLM.mockResolvedValueOnce('```json\n{"delta":{"industry":"EdTech"}}\n```');
    const delta = await extractFields(transcript, base);
    expect(delta).toEqual({ industry: 'EdTech' });
  });

  it('returns {} when the LLM output is not valid JSON', async () => {
    callLLM.mockResolvedValueOnce('sorry, I could not extract anything');
    const delta = await extractFields(transcript, base);
    expect(delta).toEqual({});
  });

  it('returns {} for too-short transcripts without calling the LLM', async () => {
    const delta = await extractFields([transcript[0]], base);
    expect(delta).toEqual({});
  });
});
