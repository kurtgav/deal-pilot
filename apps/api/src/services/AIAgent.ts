import type { CallSession, Lead, ExtractedSalesFields, TranscriptLine } from '@dealpilot/shared';
import { retrieveProductInfo, retrieveObjectionRebuttal, getAllKnowledgeContext, getDiscoveryQuestions } from './RAGService.js';

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NIM_MODEL = process.env.NIM_MODEL || 'meta/llama-3.3-70b-instruct';

export async function callLLM(system: string, user: string): Promise<string> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    throw new Error(
      'NVIDIA_NIM_API_KEY is missing. Add it to apps/api/.env or root .env, then restart the dev server.'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: NIM_MODEL,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        max_tokens: 512,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`NIM API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "I didn't catch that — could you say that again?";
  } finally {
    clearTimeout(timeout);
  }
}

const SYSTEM_PROMPT = `You are DealPilot AI, an AI Sales Engineer on a live voice discovery call. You are professional, concise, and technically knowledgeable.

You work for DealPilot — a real-time voice AI sales engineering platform for B2B SaaS companies.

PRODUCT KNOWLEDGE:
- Starter Plan ($499/mo): 50 AI calls/month, basic scoring, CRM export
- Professional Plan ($1,499/mo): Unlimited calls, advanced scoring, real-time copilot, Slack/CRM integrations
- Enterprise Plan (Custom): Everything + SOC 2, SSO, dedicated infrastructure, 99.9% SLA

RULES:
1. Keep responses SHORT — 1-3 sentences max. This is voice, not text.
2. Be conversational and natural. No bullet points or lists in speech.
3. If asked something you don't know, say "I'll flag that for our team to follow up on."
4. Never deny being an AI.
5. Never make binding pricing or contract commitments.
6. Ask discovery questions to understand the prospect's needs.

PERSONA: Friendly, sharp, efficient. Like a senior solutions engineer who respects people's time.`;

export async function generateAgentResponse(
  session: CallSession,
  lead: Lead,
  latestInput: string
): Promise<{ text: string; stage: string }> {
  const stage = determineStage(session.extractedFields, session.transcript);
  const history = session.transcript.slice(-8).map(l => `${l.speaker}: ${l.text}`).join('\n');

  const context = `You are on a call with ${lead.contactName} from ${lead.company} (${lead.industry}).
Their initial interest: ${lead.initialUseCase}

CURRENT CALL STAGE: ${stage}
EXTRACTED SO FAR: ${JSON.stringify(session.extractedFields, null, 0)}

CONVERSATION:
${history}

PROSPECT just said: "${latestInput}"

Respond naturally as DealPilot AI. 1-3 sentences max.`;

  const text = await callLLM(SYSTEM_PROMPT, context);
  return { text, stage };
}

export function determineStage(fields: ExtractedSalesFields, transcript: TranscriptLine[]): string {
  const turnCount = transcript.filter(t => t.speaker === 'PROSPECT').length;
  if (turnCount <= 1) return 'intro';
  if (!fields.useCase) return 'use_case';
  if (fields.painPoints.length === 0) return 'pain_points';
  if (!fields.technicalFit || fields.technicalFit === 'Unknown') return 'technical_fit';
  if (!fields.budgetSignal || fields.budgetSignal === 'Unknown') return 'budget_and_urgency';
  if (!fields.recommendedPackage) return 'recommendation';
  return 'close';
}
