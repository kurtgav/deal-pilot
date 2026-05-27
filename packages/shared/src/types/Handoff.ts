export type DealStage =
  | 'Marketing Qualified Lead'
  | 'Sales Qualified Lead'
  | 'Opportunity'
  | 'Needs Review';

export interface CRMPayload {
  company: string;
  contact: string;
  industry: string;
  useCase: string;
  painPoints: string[];
  recommendedSolution: string;
  qualificationScore: number;
  dealStage: DealStage;
  urgency: string;
  budgetSignal: string;
  objections: string[];
  nextStep: string;
  handoffSummary: string;
}

export interface Handoff {
  sessionId: string;
  leadId: string;
  generatedAt: string;
  summary: string;
  qualification: {
    score: number;
    dealStage: DealStage;
    productFit: string;
    urgency: string;
    budgetSignal: string;
    recommendedNextStep: string;
  };
  crmJson: CRMPayload;
  followUpEmailDraft: string;
  flaggedQuestions: string[];
}
