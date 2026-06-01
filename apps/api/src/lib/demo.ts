import type { ExtractedSalesFields } from '@dealpilot/shared';

/**
 * DEMO_MODE — deterministic, key-less responses so a full call (intro →
 * discovery → field extraction → handoff) runs with ZERO external AI keys.
 * STT/TTS already degrade gracefully (browser Web Speech + SpeechSynthesis),
 * so the only thing to fake is the LLM. callLLM() routes here when enabled.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

/** Scripted prospect turns. Collectively they populate 8 copilot fields,
 *  comfortably clearing the PRD's "≥6 fields" demo-success bar. */
export const DEMO_SCRIPT: string[] = [
  'We run live tutoring voice rooms and we are in the EdTech space.',
  'Our main problem is high latency and scaling to thousands of students.',
  'We need this live this quarter, it is pretty urgent for us.',
  'We have approved budget and we already use REST APIs and webhooks.',
  'I am a bit concerned the integration will take too long.',
  'That sounds good — what would the next step be?',
];

/** Deterministic field extraction by keyword. Returns only NEWLY-detectable
 *  fields present in the prompt text (the field extractor merges deltas). */
export function extractDemoFields(text: string): Partial<ExtractedSalesFields> {
  const t = text.toLowerCase();
  const d: Partial<ExtractedSalesFields> = {};
  if (/edtech/.test(t)) d.industry = 'EdTech';
  if (/voice rooms|tutoring/.test(t)) d.useCase = 'Live tutoring voice rooms';
  const pains: string[] = [];
  if (/latency/.test(t)) pains.push('High latency');
  if (/scal(e|ing|ability|ing)/.test(t)) pains.push('Scaling to many users');
  if (pains.length) d.painPoints = pains;
  if (/this quarter|urgent|asap|immediately/.test(t)) d.urgency = 'High';
  if (/approved budget|budget|pricing/.test(t)) d.budgetSignal = 'High';
  if (/api|sdk|webhook|integrat/.test(t)) d.technicalFit = 'Strong';
  if (/concerned|worried|too long|expensive|hesitant/.test(t)) d.objections = ['Concerned about integration time'];
  if (/next step|follow up|schedule|deep-dive|demo/.test(t)) d.nextStep = 'Schedule a technical deep-dive';
  return d;
}

function field(re: RegExp, user: string): string {
  return user.match(re)?.[1]?.trim() ?? '';
}

/** Canned agent reply chosen by the CURRENT CALL STAGE embedded in the prompt. */
function demoAgentReply(user: string): string {
  if (/\[SYSTEM:/.test(user)) {
    const name = field(/Name:\s*(.+)/, user).split(' ')[0] || 'there';
    return `Hi ${name}, I'm DealPilot AI, an AI sales assistant. I took a look at your business and I'm keen to understand your real-time voice needs. What are you working on?`;
  }
  const stage = field(/CURRENT CALL STAGE:\s*(\w+)/, user);
  const byStage: Record<string, string> = {
    intro: "Great to meet you. To start, what's the main problem you're hoping to solve?",
    use_case: 'Got it. Can you tell me more about how your team uses voice today?',
    pain_points: 'That makes sense. What part of that is causing the most friction right now?',
    technical_fit: 'Helpful — and what does your current stack look like for integrations?',
    budget_and_urgency: 'Understood. How soon are you looking to have something live?',
    recommendation: 'Based on what you have shared, our Professional plan looks like the strongest fit for your scale and integrations.',
    close: 'Perfect. The next step would be a short technical deep-dive with our team — shall I set that up?',
  };
  return byStage[stage] ?? 'Thanks for sharing that — tell me a little more.';
}

/** Deterministic handoff summary/email built from the prompt's lead context. */
function demoSummary(user: string): string {
  const m = user.match(/Lead:\s*(.+?)\s+at\s+(.+?)\s*\(/);
  const who = m ? `${m[1]} at ${m[2]}` : 'the prospect';
  return `Discovery call with ${who}. Strong interest in real-time voice for live tutoring at scale; approved budget and an API-ready stack, with some concern about integration effort. Recommended Professional plan; next step is a technical deep-dive.`;
}

function demoEmail(user: string): string {
  const name = field(/Lead:\s*(\w+)/, user) || 'there';
  return `Hi ${name},\n\nThanks for the great conversation about your live tutoring voice rooms. It's clear low latency and scaling are top priorities, and I'm confident our Professional plan fits both your scale and your existing API stack.\n\nI understand the concern about integration time — our team can walk you through a typical timeline in a short technical deep-dive.\n\nWould sometime next week work to go deeper?\n\nBest regards,\nDealPilot AI`;
}

/** Route a callLLM(system, user) request to the right canned response. */
export function demoComplete(system: string, user: string): string {
  if (/extraction engine/i.test(system)) {
    return JSON.stringify({ delta: extractDemoFields(user) });
  }
  if (/sales operations assistant/i.test(system)) return demoSummary(user);
  if (/follow-up email/i.test(system)) return demoEmail(user);
  return demoAgentReply(user);
}
