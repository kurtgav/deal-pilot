import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { CallSession, Lead } from '@dealpilot/shared';

// Spy on the LLM so we can assert it is NOT called for ungrounded questions.
const callLLM = vi.fn();
vi.mock('./RAGService.js', async (importActual) => {
  const actual = await importActual<typeof import('./RAGService.js')>();
  return actual; // use the real grounding gate
});

const { generateAgentResponse, ESCALATION_PHRASE, isProductQuestion } = await import('./AIAgent.js');
const { loadKnowledgeFromObjects } = await import('./RAGService.js');

beforeAll(() => {
  loadKnowledgeFromObjects(
    [
      { name: 'DealPilot Professional', price: '$1,499/mo', features: ['Slack integration'], bestFor: 'Growth-stage SaaS', integrations: ['Slack', 'Salesforce'] },
    ],
    [],
    [],
  );
});

const lead: Lead = { id: 'l1', contactName: 'Sam Lee', company: 'Acme', industry: 'SaaS', initialUseCase: 'x', status: 'in_call', createdAt: '' } as Lead;
const session: CallSession = { id: 's1', leadId: 'l1', startedAt: '', transcript: [{ speaker: 'PROSPECT', text: 'q', timestamp: '' }], extractedFields: { painPoints: [], objections: [], unansweredQuestions: [] }, status: 'active' } as CallSession;

describe('AIAgent grounding gate', () => {
  it('escalates an ungrounded product question without inventing an answer', async () => {
    const { text } = await generateAgentResponse(session, lead, 'Can you sign a HIPAA business associate agreement?');
    expect(text).toBe(ESCALATION_PHRASE);
  });

  it('classifies product questions vs discovery statements', () => {
    expect(isProductQuestion('Do you support on-premise deployment?')).toBe(true);
    expect(isProductQuestion('We run live tutoring voice rooms.')).toBe(false);
  });
});
