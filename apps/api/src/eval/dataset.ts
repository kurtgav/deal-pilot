import type { ExtractedSalesFields } from '@dealpilot/shared';

/** A product/technical question the agent may face on a call.
 *  inKB === true  → answer is grounded in the knowledge base (should answer).
 *  inKB === false → outside the KB (MUST escalate, must NOT fabricate). */
export interface QACase {
  q: string;
  inKB: boolean;
}

/** Grounding eval set. Out-of-KB cases are the ones that catch hallucination:
 *  the agent must escalate rather than invent pricing/features/SLAs. */
export const QA_CASES: QACase[] = [
  // --- In-KB: covered by products.json (Starter/Professional/Enterprise) ---
  { q: 'How much is the Starter plan?', inKB: true },
  { q: 'What does the Professional plan include?', inKB: true },
  { q: 'Do you integrate with Salesforce?', inKB: true },
  { q: 'Is there a Slack integration?', inKB: true },
  { q: 'What CRM integrations are on the Professional plan?', inKB: true },
  { q: 'How many calls does the Starter plan allow per month?', inKB: true },
  { q: 'Do you have SOC 2 compliance?', inKB: true },
  { q: 'What plan is best for a 30-rep sales team?', inKB: true },
  { q: 'Is there custom pricing for enterprise?', inKB: true },
  { q: 'Does the Enterprise plan offer SSO or SAML?', inKB: true },
  { q: 'Can I export leads to a CSV?', inKB: true },
  { q: 'What lead scoring features do you offer?', inKB: true },

  // --- Out-of-KB: NOT covered anywhere in the knowledge base ---
  { q: 'Do you support on-premise deployment in our own AWS account?', inKB: false },
  { q: 'What is your data retention period in days for call recordings?', inKB: false },
  { q: 'Can you sign a HIPAA business associate agreement?', inKB: false },
  { q: 'Do you offer a Spanish-language voice agent?', inKB: false },
  { q: 'What is the per-minute cost of the voice transcription?', inKB: false },
  { q: 'Is there a mobile app for iOS and Android?', inKB: false },
  { q: 'Do you integrate with Microsoft Dynamics 365?', inKB: false },
  { q: 'What is your guaranteed uptime for the Starter plan?', inKB: false },
  { q: 'Can the AI place outbound phone calls to leads?', inKB: false },
  { q: 'Do you offer a perpetual on-prem license with a one-time fee?', inKB: false },
  { q: 'What embedding model do you use under the hood?', inKB: false },
];

/** A transcript turn plus the fields a human labeled as extractable from it.
 *  Used to measure extraction precision/recall against ground truth. */
export interface ExtractionCase {
  prospectText: string;
  expected: Partial<ExtractedSalesFields>;
}

export const EXTRACTION_CASES: ExtractionCase[] = [
  {
    prospectText: "We run live tutoring voice rooms and it's fairly urgent — we need something this quarter.",
    expected: { useCase: 'Live tutoring voice rooms', urgency: 'High' },
  },
  {
    prospectText: "We're an EdTech company. Our biggest problem is reps can't answer technical SDK questions on calls.",
    expected: { industry: 'EdTech', painPoints: ['reps cannot answer technical questions on calls'] },
  },
  {
    prospectText: "Honestly it seems too expensive, and I'm not sure we have budget allocated this year.",
    expected: { objections: ['too expensive'], budgetSignal: 'Low' },
  },
  {
    prospectText: "We use Salesforce and have a strong engineering team, integration shouldn't be an issue.",
    expected: { technicalFit: 'Strong' },
  },
  {
    prospectText: "Next step would be to loop in our VP of Sales for a follow-up demo next week.",
    expected: { nextStep: 'Follow-up demo with VP of Sales' },
  },
];
