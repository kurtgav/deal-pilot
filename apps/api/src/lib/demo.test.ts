import { describe, it, expect, beforeAll } from 'vitest';
import type { CallSession, Lead, ExtractedSalesFields, TranscriptLine } from '@dealpilot/shared';

// Prove the call runs with ZERO external AI keys: enable demo mode and remove
// the NVIDIA key the shared test setup injects.
beforeAll(() => {
  process.env.DEMO_MODE = 'true';
  delete process.env.NVIDIA_NIM_API_KEY;
  delete process.env.DEEPGRAM_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
});

const { DEMO_SCRIPT, demoComplete } = await import('./demo.js');
const { extractFields } = await import('../services/FieldExtractor.js');
const { generateHandoff } = await import('../services/HandoffGenerator.js');

const lead: Lead = {
  id: 'l1', contactName: 'Sarah Chen', company: 'StreamScale', industry: 'EdTech',
  initialUseCase: 'Live tutoring voice rooms', status: 'in_call', createdAt: '',
} as Lead;

// Mirror SocketServer.mergeFields (absolute scalars, deduped array append).
function merge(t: ExtractedSalesFields, d: Partial<ExtractedSalesFields>) {
  for (const k of ['industry', 'useCase', 'budgetSignal', 'urgency', 'technicalFit', 'recommendedPackage', 'nextStep'] as const) {
    if (d[k]) (t as any)[k] = d[k];
  }
  for (const k of ['painPoints', 'objections', 'unansweredQuestions'] as const) {
    if (d[k]?.length) t[k] = Array.from(new Set([...t[k], ...d[k]!]));
  }
}

function countPopulated(f: ExtractedSalesFields): number {
  let n = 0;
  if (f.industry) n++;
  if (f.useCase) n++;
  if (f.painPoints.length) n++;
  if (f.budgetSignal) n++;
  if (f.urgency) n++;
  if (f.technicalFit) n++;
  if (f.objections.length) n++;
  if (f.nextStep) n++;
  return n;
}

describe('DEMO_MODE end-to-end (no external keys)', () => {
  it('routes callLLM to canned responses by prompt type', () => {
    expect(demoComplete('You are a sales field extraction engine.', 'Recent transcript:\nPROSPECT: edtech voice rooms'))
      .toContain('"delta"');
    expect(demoComplete('You are a sales operations assistant.', 'Lead: Sarah at StreamScale (EdTech)'))
      .toMatch(/discovery call/i);
    expect(demoComplete('Write a brief, personalized follow-up email', 'Lead: Sarah at StreamScale'))
      .toMatch(/Hi Sarah/);
  });

  it('populates >=6 copilot fields from the scripted scenario', async () => {
    const session: CallSession = {
      id: 's1', leadId: 'l1', startedAt: '', status: 'active',
      transcript: [{ speaker: 'AI', text: 'Intro', timestamp: '' }],
      extractedFields: { painPoints: [], objections: [], unansweredQuestions: [] },
    } as CallSession;

    for (const turn of DEMO_SCRIPT) {
      session.transcript.push({ speaker: 'PROSPECT', text: turn, timestamp: '' } as TranscriptLine);
      const delta = await extractFields(session.transcript, session.extractedFields);
      merge(session.extractedFields, delta);
    }

    expect(countPopulated(session.extractedFields)).toBeGreaterThanOrEqual(6);

    const handoff = await generateHandoff(session, lead);
    // Valid CRM payload: required identity + qualification fields present.
    expect(handoff.crmJson.company).toBe('StreamScale');
    expect(handoff.crmJson.contact).toBe('Sarah Chen');
    expect(handoff.crmJson.useCase).toBeTruthy();
    expect(typeof handoff.crmJson.qualificationScore).toBe('number');
    expect(handoff.crmJson.qualificationScore).toBeGreaterThan(0);
    expect(handoff.summary).toMatch(/discovery call/i);
    expect(handoff.followUpEmailDraft).toMatch(/Hi Sarah/);
  });
});
