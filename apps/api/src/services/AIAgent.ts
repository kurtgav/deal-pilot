import type { CallSession, Lead, TranscriptLine, ExtractedSalesFields } from '@dealpilot/shared';
import { retrieveProductInfo, retrieveObjectionRebuttal, getAllKnowledgeContext, getDiscoveryQuestions } from './RAGService.js';

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NIM_MODEL = process.env.NIM_MODEL || 'meta/llama-3.3-70b-instruct';

export async function callLLM(system: string, user: string): Promise<string> {
  if (!process.env.NVIDIA_NIM_API_KEY) {
    return generateDemoResponse(user);
  }

  const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: NIM_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    console.error('[NIM] API error:', res.status, await res.text());
    return generateDemoResponse(user);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || generateDemoResponse(user);
}

type AgentStage = 'intro' | 'discovery' | 'qa_handling' | 'objection' | 'recommend' | 'close' | 'ended';

export function determineStage(fields: ExtractedSalesFields, transcript: TranscriptLine[]): AgentStage {
  if (transcript.length <= 1) return 'intro';
  if (fields.objections.length > 0 && transcript.slice(-2).some(t => t.speaker === 'PROSPECT' && hasObjectionSignal(t.text))) return 'objection';
  if (transcript.slice(-2).some(t => t.speaker === 'PROSPECT' && hasQuestionSignal(t.text))) return 'qa_handling';
  if (fields.useCase && fields.technicalFit && fields.urgency && fields.budgetSignal) return 'recommend';
  if (fields.recommendedPackage) return 'close';
  return 'discovery';
}

function hasObjectionSignal(text: string): boolean {
  const signals = ['expensive', 'too much', 'not sure', 'already have', 'think about it', 'complex', 'concerned', 'worried', 'replace'];
  return signals.some(s => text.toLowerCase().includes(s));
}

function hasQuestionSignal(text: string): boolean {
  return text.includes('?') || text.toLowerCase().startsWith('how') || text.toLowerCase().startsWith('what') || text.toLowerCase().startsWith('can');
}

const SYSTEM_PROMPT = `You are DealPilot AI, an AI Sales Engineer on a live voice call. You are professional, concise, and technically knowledgeable.

GOLDEN RULES (non-negotiable):
1. NEVER fabricate product information. Only use the knowledge base provided.
2. NEVER deny being an AI if asked directly.
3. NEVER make binding commitments on pricing, contracts, or SLAs.
4. Keep responses conversational and under 3 sentences for voice delivery.
5. If you cannot answer from the knowledge base, say: "That's a great technical question — I'll flag this for our human sales engineer in the follow-up."

PERSONA: Friendly, knowledgeable, efficient. You sound like a senior solutions engineer who respects the prospect's time.`;

export async function generateAgentResponse(
  session: CallSession,
  lead: Lead,
  latestInput: string
): Promise<{ text: string; stage: AgentStage }> {
  const stage = determineStage(session.extractedFields, session.transcript);
  let contextBlock = '';

  switch (stage) {
    case 'intro':
      contextBlock = `Lead: ${lead.contactName} at ${lead.company} (${lead.industry}). Use case hypothesis: ${lead.initialUseCase}. Introduce yourself and begin discovery.`;
      break;
    case 'objection': {
      const rebuttal = retrieveObjectionRebuttal(latestInput);
      contextBlock = rebuttal
        ? `The prospect raised an objection. Use this trained rebuttal as your base (adapt naturally): "${rebuttal}"`
        : `The prospect raised a concern. Acknowledge it empathetically and redirect to value.`;
      break;
    }
    case 'qa_handling':
      contextBlock = `KNOWLEDGE BASE:\n${retrieveProductInfo(latestInput)}\n\nAnswer the prospect's question ONLY using the above. If not covered, escalate.`;
      break;
    case 'recommend':
      contextBlock = `Based on extracted fields: ${JSON.stringify(session.extractedFields)}\nKNOWLEDGE BASE:\n${getAllKnowledgeContext()}\n\nRecommend the best-fit package.`;
      break;
    case 'close':
      contextBlock = `Fields: ${JSON.stringify(session.extractedFields)}\nAsk for a concrete next step (demo, technical deep-dive, or trial).`;
      break;
    default: {
      const questions = getDiscoveryQuestions('use_case');
      contextBlock = `Continue discovery. Suggested questions: ${questions.join(' | ')}\nExtracted so far: ${JSON.stringify(session.extractedFields)}`;
    }
  }

  const conversationHistory = session.transcript.slice(-8).map(l => `${l.speaker}: ${l.text}`).join('\n');

  const text = await callLLM(
    SYSTEM_PROMPT,
    `${contextBlock}\n\nCONVERSATION:\n${conversationHistory}\n\nPROSPECT (latest): ${latestInput}\n\nRespond as DealPilot AI (keep it concise, conversational, 1-3 sentences):`
  );

  return { text, stage };
}

function generateDemoResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('intro') || lower.includes('begin')) {
    return "Hi! I'm DealPilot AI, your AI sales engineer for today. I'd love to learn about what you're building and see how we can help. Could you tell me about your team's current sales process?";
  }
  if (lower.includes('objection') || lower.includes('expensive')) {
    return "I understand budget is a key consideration. Many teams find DealPilot pays for itself within the first month by increasing SQL conversion by 40%. Would it help to walk through the ROI for your team size?";
  }
  if (lower.includes('?')) {
    return "That's a great question. Based on our product capabilities, we support that use case through our Professional plan which includes unlimited AI-assisted calls and real-time copilot features. Would you like me to go deeper on any specific aspect?";
  }
  return "Thanks for sharing that. It sounds like your team could benefit from automated technical discovery. Can you tell me more about the volume of calls your team handles weekly?";
}
