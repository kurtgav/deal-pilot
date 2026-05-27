import type { CallSession, Lead, Handoff, CRMPayload } from '@dealpilot/shared';
import { scoreLeadFromFields, getDealStage } from './LeadScorer.js';
import { callLLM } from './AIAgent.js';

export async function generateHandoff(session: CallSession, lead: Lead): Promise<Handoff> {
  const score = session.leadScore ?? scoreLeadFromFields(session.extractedFields);
  const dealStage = getDealStage(score);
  const fields = session.extractedFields;
  const transcriptText = session.transcript.map(l => `${l.speaker}: ${l.text}`).join('\n');

  // Generate summary and email in parallel
  const [summary, emailDraft] = await Promise.all([
    callLLM(
      'You are a sales operations assistant. Generate a concise 2-3 sentence summary of this sales call for CRM notes. No markdown.',
      `Lead: ${lead.contactName} at ${lead.company} (${lead.industry})\nFields: ${JSON.stringify(fields)}\nTranscript:\n${transcriptText}`
    ).catch(() => `Discovery call with ${lead.contactName} from ${lead.company}. Discussed ${fields.useCase || lead.initialUseCase}. Score: ${score}/100.`),
    callLLM(
      'Write a brief, personalized follow-up email (3-4 short paragraphs). Professional tone. Reference specific points from the call. No subject line — just the body. No markdown formatting.',
      `Lead: ${lead.contactName} at ${lead.company} (${lead.industry})\nUse case: ${fields.useCase || lead.initialUseCase}\nRecommended: ${fields.recommendedPackage || 'Professional'}\nNext step: ${fields.nextStep || 'Technical deep-dive'}\nPain points: ${fields.painPoints.join(', ') || 'Not identified'}`
    ).catch(() => `Hi ${lead.contactName.split(' ')[0]},\n\nThank you for taking the time to speak with us today about ${fields.useCase || lead.initialUseCase}.\n\nBased on our conversation, I believe our ${fields.recommendedPackage || 'Professional'} plan would be a great fit for ${lead.company}.\n\nI'd love to schedule a follow-up to dive deeper into the technical details. Would next week work for you?\n\nBest regards,\nDealPilot Team`),
  ]);

  const crmJson: CRMPayload = {
    company: lead.company,
    contact: lead.contactName,
    industry: fields.industry || lead.industry,
    useCase: fields.useCase || lead.initialUseCase,
    painPoints: fields.painPoints,
    recommendedSolution: fields.recommendedPackage || 'DealPilot Professional',
    qualificationScore: score,
    dealStage,
    urgency: fields.urgency || 'Unknown',
    budgetSignal: fields.budgetSignal || 'Unknown',
    objections: fields.objections,
    nextStep: fields.nextStep || 'Follow-up scheduled',
    handoffSummary: summary,
  };

  return {
    sessionId: session.id,
    leadId: lead.id,
    generatedAt: new Date().toISOString(),
    summary,
    qualification: {
      score,
      dealStage,
      productFit: fields.technicalFit || 'Unknown',
      urgency: fields.urgency || 'Unknown',
      budgetSignal: fields.budgetSignal || 'Unknown',
      recommendedNextStep: fields.nextStep || 'Schedule technical deep-dive',
    },
    crmJson,
    followUpEmailDraft: emailDraft,
    flaggedQuestions: fields.unansweredQuestions,
  };
}
