import type { CallSession, Lead, ExtractedSalesFields, TranscriptLine } from '@dealpilot/shared';
import {
  retrieveProductInfo,
  retrieveObjectionRebuttal,
  getDiscoveryQuestions,
} from './RAGService.js';

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NIM_MODEL = process.env.NIM_MODEL || 'meta/llama-3.3-70b-instruct';

const LLM_TIMEOUT_MS = 30000;
const LLM_MAX_RETRIES = 2;
const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Call the NVIDIA NIM-hosted LLM. Retries up to LLM_MAX_RETRIES on transient
 * network/server errors with exponential back-off.
 */
export async function callLLM(system: string, user: string): Promise<string> {
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
          max_tokens: 320,
          temperature: 0.5, // lower than before for more consistent sales answers
          top_p: 0.9,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        if (TRANSIENT_STATUS.has(res.status) && attempt < LLM_MAX_RETRIES) {
          await delay(250 * Math.pow(2, attempt));
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
      if (err?.name === 'AbortError' && attempt < LLM_MAX_RETRIES) {
        await delay(250 * Math.pow(2, attempt));
        continue;
      }
      if (attempt < LLM_MAX_RETRIES) {
        await delay(250 * Math.pow(2, attempt));
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

const FILIPINO_MARKERS =
  /\b(ako|ikaw|kayo|kami|tayo|sila|niya|natin|namin|ninyo|nila|ang|ng|sa|mga|hindi|oo|opo|po|kasi|kaya|naman|talaga|paano|bakit|saan|kailan|sino|ano|alin|ilan|magkano|salamat|maganda|magandang|kumusta|paalam|gusto|ayaw|pwede|puwede|sige|meron|mayroon|wala|nasaan|tulungan|tungkol|kahit|para|pero|kung|noong|ngayon|bukas|kahapon|mahal|mura|presyo|trabaho)\b/i;

function detectLanguage(text: string): 'en' | 'fil' {
  return FILIPINO_MARKERS.test(text) ? 'fil' : 'en';
}

// ---------- System prompt ----------

const SYSTEM_PROMPT = `You are DealPilot AI, an AI Sales Engineer on a live voice discovery call. You are professional, concise, and technically knowledgeable.

GOLDEN RULES (non-negotiable):
1. NEVER fabricate product information. Only answer from the PRODUCT KNOWLEDGE provided in the user prompt.
2. NEVER deny being an AI if asked directly.
3. NEVER make binding commitments on pricing, contracts, SLAs, or delivery dates.
4. If a question is outside your knowledge, say: "That's a great question — I'll flag this for our solutions team to follow up on."
5. Keep responses to 1-3 short sentences. This is voice, not text.
6. Be conversational. No bullet points, no numbered lists, no markdown.
7. If the prospect speaks Filipino/Tagalog, respond in natural Filipino (Taglish is fine). If they speak English, respond in English.

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

export async function generateAgentResponse(
  session: CallSession,
  lead: Lead,
  latestInput: string,
): Promise<{ text: string; stage: string }> {
  const stage = determineStage(session.extractedFields, session.transcript);
  const history = session.transcript
    .slice(-8)
    .map((l) => `${l.speaker}: ${l.text}`)
    .join('\n');

  const language = detectLanguage(latestInput);
  const productContext = retrieveProductInfo(latestInput);
  const objectionRebuttal = retrieveObjectionRebuttal(latestInput);
  const discoveryQs = getDiscoveryQuestions(stage);

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

  const languageInstruction =
    language === 'fil'
      ? '\n\nThe prospect is speaking Filipino/Tagalog. Reply in natural Filipino or Taglish — keep it short and conversational.'
      : '';

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

PROSPECT just said: "${latestInput}"${languageInstruction}

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
