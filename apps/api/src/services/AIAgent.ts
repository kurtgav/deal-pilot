import type { CallSession, Lead, ExtractedSalesFields, TranscriptLine } from '@dealpilot/shared';
import {
  assessProductGrounding,
  retrieveObjectionRebuttal,
  getDiscoveryQuestions,
} from './RAGService.js';
import { isDemoMode, demoComplete } from '../lib/demo.js';

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NIM_MODEL = process.env.NIM_MODEL || 'meta/llama-3.3-70b-instruct';

const LLM_TIMEOUT_MS = 15000;
const LLM_MAX_RETRIES = 1;
const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Call the NVIDIA NIM-hosted LLM. Optimized for fast voice responses.
 */
export async function callLLM(system: string, user: string): Promise<string> {
  // DEMO_MODE: serve canned deterministic responses so a full call runs with
  // zero external keys (judge-demo stability). Bypasses the network entirely.
  if (isDemoMode()) return demoComplete(system, user);

  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    throw new Error(
      'NVIDIA_NIM_API_KEY is missing. Add it to apps/api/.env or root .env, then restart the dev server.',
    );
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    try {
      const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: NIM_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: 150,
          temperature: 0.3,
          top_p: 0.85,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        if (TRANSIENT_STATUS.has(res.status) && attempt < LLM_MAX_RETRIES) {
          await delay(100);
          continue;
        }
        throw new Error(`NIM API ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const content: string | undefined = data.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        return "I didn't quite catch that — could you say a little more about what you're looking for?";
      }
      return content.trim();
    } catch (err: any) {
      lastErr = err;
      if (attempt < LLM_MAX_RETRIES) {
        await delay(100);
        continue;
      }
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('LLM call failed');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Language detection (server side, mirror of frontend) ----------

// ---------- System prompt ----------

const SYSTEM_PROMPT = `You are DealPilot AI, an AI Sales Engineer on a live voice discovery call. You are professional, concise, and technically knowledgeable.

GOLDEN RULES (non-negotiable):
1. NEVER fabricate product information. Only answer from the PRODUCT KNOWLEDGE provided in the user prompt.
2. NEVER deny being an AI if asked directly.
3. NEVER make binding commitments on pricing, contracts, SLAs, or delivery dates.
4. If a question is outside your knowledge, say: "That's a great question — I'll flag this for our solutions team to follow up on."
5. Keep responses to 1-3 short sentences. This is voice, not text.
6. Be conversational. No bullet points, no numbered lists, no markdown.

PERSONA: Friendly, sharp, efficient. Like a senior solutions engineer who respects people's time.

PRE-CALL INTELLIGENCE (CRITICAL):
You have researched the prospect's company website BEFORE this call. Use this knowledge to:
- Reference their specific products, services, or industry when relevant.
- Anticipate their likely pain points based on what their company does.
- Connect our solutions to their actual business context.
- Show you've done your homework — mention specifics from their site naturally.
- Predict what they likely need and proactively suggest relevant solutions.
Do NOT dump all research at once. Weave it naturally into conversation.

CALL STRUCTURE:
- Open with a personalized reference showing you know their business.
- Discovery first: validate your hypotheses about their needs.
- Answer product/technical questions strictly from PRODUCT KNOWLEDGE.
- Handle objections calmly using SUGGESTED REBUTTAL when provided.
- When enough info is gathered, recommend a fitting plan.
- Close with a clear next-step question.`;

// ---------- Public API ----------

/** Spoken when a product/technical question cannot be grounded in the
 *  knowledge base (Golden Rule #1 — never fabricate). */
export const ESCALATION_PHRASE =
  "That's a great question — I'll flag this for our solutions team to follow up on.";

/** Golden Rule: the AI must disclose it is an AI in the FIRST sentence of every
 *  session. Enforce in code, not just the prompt — if a generated intro lacks
 *  a disclosure, prepend one rather than trusting the model. */
const DISCLOSURE_PATTERN = /\b(ai|a\.i\.|artificial intelligence|automated assistant|virtual assistant)\b/i;

export function enforceAIDisclosure(intro: string, contactFirstName?: string): string {
  const firstSentence = intro.split(/(?<=[.!?])\s/)[0] ?? intro;
  if (DISCLOSURE_PATTERN.test(firstSentence)) return intro;
  const hi = contactFirstName ? `Hi ${contactFirstName}, ` : 'Hi, ';
  return `${hi}I'm DealPilot AI, an AI sales assistant. ${intro}`.trim();
}

/** Heuristic: does the utterance look like a product/technical question (the
 *  only kind the grounding gate should block)? Discovery statements are not
 *  gated, so we never escalate when the prospect is just describing their needs. */
export function isProductQuestion(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.includes('?')) return true;
  return /\b(do|does|can|could|is|are|what|how|which|when|will|would|support|offer|integrat|price|pricing|cost|plan|sla|uptime|comply|compliance)\b/.test(
    t,
  );
}

export async function generateAgentResponse(
  session: CallSession,
  lead: Lead,
  latestInput: string,
): Promise<{ text: string; stage: string }> {
  const stage = determineStage(session.extractedFields, session.transcript);
  const history = session.transcript
    .slice(-6)
    .map((l) => `${l.speaker}: ${l.text}`)
    .join('\n');

  const grounding = assessProductGrounding(latestInput);
  const objectionRebuttal = retrieveObjectionRebuttal(latestInput);
  const discoveryQs = getDiscoveryQuestions(stage);

  // GROUNDING GATE (Golden Rule #1): if the prospect asks a product/technical
  // question we cannot ground in the knowledge base, escalate instead of
  // letting the LLM fabricate pricing/features/SLAs. Non-questions (discovery
  // statements) are not gated — only questions can be "answered" wrongly.
  if (!grounding.grounded && !objectionRebuttal && isProductQuestion(latestInput)) {
    return { text: ESCALATION_PHRASE, stage };
  }

  const productContext = grounding.context;
  const ragSections: string[] = [`PRODUCT KNOWLEDGE (top matches):\n${productContext}`];
  if (objectionRebuttal) {
    ragSections.push(`OBJECTION DETECTED — SUGGESTED REBUTTAL:\n${objectionRebuttal}`);
  }
  if (discoveryQs.length > 0 && stage !== 'close' && stage !== 'recommendation') {
    ragSections.push(
      `SUGGESTED DISCOVERY QUESTIONS FOR THIS STAGE (${stage}):\n${discoveryQs
        .map((q) => `- ${q}`)
        .join('\n')}`,
    );
  }

  const companyContext = lead.scrapedContext
    ? `\nPROSPECT'S COMPANY RESEARCH (scraped from ${lead.companyUrl}):\n${lead.scrapedContext}\n\nBased on this research, their likely needs include: integration with their existing platform, scalability for their user base, and solutions that fit their ${lead.industry || 'technology'} vertical.\n`
    : '';

  const userPrompt = `LEAD CONTEXT:
- Name: ${lead.contactName}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Initial Interest: ${lead.initialUseCase}
${companyContext}
CURRENT CALL STAGE: ${stage}
EXTRACTED SO FAR: ${JSON.stringify(session.extractedFields)}

${ragSections.join('\n\n')}

CONVERSATION (most recent first is at bottom):
${history}

PROSPECT just said: "${latestInput}"

Respond naturally as DealPilot AI. Reference their company context when relevant. 1-3 short sentences. No markdown.`;

  const text = await callLLM(SYSTEM_PROMPT, userPrompt);
  return { text, stage };
}

export function determineStage(
  fields: ExtractedSalesFields,
  transcript: TranscriptLine[],
): string {
  const turnCount = transcript.filter((t) => t.speaker === 'PROSPECT').length;
  if (turnCount <= 1) return 'intro';
  if (!fields.useCase) return 'use_case';
  if (fields.painPoints.length === 0) return 'pain_points';
  if (!fields.technicalFit || fields.technicalFit === 'Unknown') return 'technical_fit';
  if (!fields.budgetSignal || fields.budgetSignal === 'Unknown') return 'budget_and_urgency';
  if (!fields.recommendedPackage) return 'recommendation';
  return 'close';
}
