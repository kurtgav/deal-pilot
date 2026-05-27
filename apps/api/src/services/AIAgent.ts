import type { CallSession, Lead, TranscriptLine, ExtractedSalesFields } from '@dealpilot/shared';
import { retrieveProductInfo, retrieveObjectionRebuttal, getAllKnowledgeContext, getDiscoveryQuestions } from './RAGService.js';

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NIM_MODEL = process.env.NIM_MODEL || 'meta/llama-3.3-70b-instruct';

export async function callLLM(system: string, user: string): Promise<string> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_NIM_API_KEY is not set. Add it to your .env file.');
  }

  const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: NIM_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[NIM] API error:', res.status, errText);
    throw new Error(`NIM API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'I didn\'t catch that, could you repeat?';
}

const SYSTEM_PROMPT = `You are DealPilot AI, an AI Sales Engineer on a live voice call. You are professional, concise, and technically knowledgeable.

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
  const conversationHistory = session.transcript.slice(-10).map(l => `${l.speaker}: ${l.text}`).join('\n');

  const context = `You are on a call with ${lead.contactName} from ${lead.company} (${lead.industry}).
Their initial interest: ${lead.initialUseCase}

CONVERSATION SO FAR:
${conversationHistory}

PROSPECT just said: "${latestInput}"

Respond naturally as DealPilot AI. Keep it to 1-3 sentences.`;

  const text = await callLLM(SYSTEM_PROMPT, context);
  return { text, stage: 'active' };
}

// Keep these exports for field extraction and handoff
export function determineStage(fields: ExtractedSalesFields, transcript: TranscriptLine[]): string {
  return 'active';
}
