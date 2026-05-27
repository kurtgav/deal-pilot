import type { CallSession, Lead, Handoff, CRMPayload } from '@dealpilot/shared';
import { scoreLeadFromFields, getDealStage } from './LeadScorer.js';
import { callLLM } from './AIAgent.js';

export async function generateHandoff(session: CallSession, lead: Lead): Promise<Handoff> {
  const score = session.leadScore ?? scoreLeadFromFields(session.extractedFields);
  const dealStage = getDealStage(score);
  const fields = session.extractedFields;

  const transcriptText = session.transcript.map(l => `${l.speaker}: ${l.text}`).join('\n');

  const summary = await callLLM(
    'You are a sales operations assistant. Generate a concise 2-3 sentence summary of this sales call for CRM notes.',
    `Lead: ${lead.contactName} at ${lead.company}\nFields: ${JSON.stringify(fields)}\nTranscript:\n${transcriptText}`
  );

  const emailDraft = await callLLM(
    'You are a sales follow-up email writer. Write a brief, personalized follow-up email (3-4 paragraphs max). Be professional and reference specific points from the call.',
    `Lead: ${lead.contactName} at ${lead.company} (${lead.industry})\nUse case: ${fields.useCase || lead.initialUseCase}\nRecommended package: ${fields.recommendedPackage || 'Professional'}\nNext step: ${fields.nextStep || 'Technical deep-dive'}\nKey pain points: ${fields.painPoints.join(', ')}`
  );

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
