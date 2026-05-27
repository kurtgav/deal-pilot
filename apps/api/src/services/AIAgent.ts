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

GOLDEN RULES (non-negotiable):
1. NEVER fabricate product information. Only answer from the PRODUCT KNOWLEDGE provided below.
2. NEVER deny being an AI if asked directly.
3. NEVER make binding commitments on pricing, contracts, SLAs, or delivery dates.
4. If a question is outside your knowledge, say: "That's a great question — I'll flag this for our solutions team to follow up on."
5. Keep responses to 1-3 sentences. This is voice, not text.
6. Be conversational. No bullet points, no numbered lists, no markdown.

PERSONA: Friendly, sharp, efficient. Like a senior solutions engineer who respects people's time.

CALL STRUCTURE:
- Start with discovery questions to understand needs
- Answer product/technical questions from knowledge base
- Handle objections calmly with trained rebuttals
- When enough info gathered, recommend a package
- Close with a next-step question`;

export async function generateAgentResponse(
  session: CallSession,
  lead: Lead,
  latestInput: string
): Promise<{ text: string; stage: string }> {
  const stage = determineStage(session.extractedFields, session.transcript);
  const history = session.transcript.slice(-8).map(l => `${l.speaker}: ${l.text}`).join('\n');

  // RAG: retrieve relevant product info based on prospect's latest input
  const productContext = retrieveProductInfo(latestInput);
  const objectionRebuttal = retrieveObjectionRebuttal(latestInput);
  const discoveryQs = getDiscoveryQuestions(stage);

  let ragContext = `\nPRODUCT KNOWLEDGE:\n${productContext}`;
  if (objectionRebuttal) {
    ragContext += `\n\nOBJECTION DETECTED — SUGGESTED REBUTTAL:\n${objectionRebuttal}`;
  }
  if (discoveryQs.length > 0 && stage !== 'close') {
    ragContext += `\n\nSUGGESTED DISCOVERY QUESTIONS FOR THIS STAGE (${stage}):\n${discoveryQs.join('\n')}`;
  }

  const userPrompt = `LEAD CONTEXT:
- Name: ${lead.contactName}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Initial Interest: ${lead.initialUseCase}

CURRENT CALL STAGE: ${stage}
EXTRACTED SO FAR: ${JSON.stringify(session.extractedFields, null, 0)}
${ragContext}

CONVERSATION:
${history}

PROSPECT just said: "${latestInput}"

Respond naturally as DealPilot AI. 1-3 sentences max.`;

  const text = await callLLM(SYSTEM_PROMPT, userPrompt);
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
