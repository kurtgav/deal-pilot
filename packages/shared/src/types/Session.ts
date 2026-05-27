export interface TranscriptLine {
  speaker: 'AI' | 'PROSPECT' | 'REP';
  text: string;
  timestamp: string;
}

export interface ExtractedSalesFields {
  industry?: string;
  useCase?: string;
  painPoints: string[];
  budgetSignal?: 'Low' | 'Medium' | 'High' | 'Unknown';
  urgency?: 'Low' | 'Medium' | 'High' | 'Unknown';
  technicalFit?: 'Weak' | 'Moderate' | 'Strong' | 'Unknown';
  objections: string[];
  recommendedPackage?: string;
  nextStep?: string;
  unansweredQuestions: string[];
}

export type SessionStatus = 'active' | 'ended';

export interface CallSession {
  id: string;
  leadId: string;
  startedAt: string;
  endedAt?: string;
  transcript: TranscriptLine[];
  extractedFields: ExtractedSalesFields;
  leadScore?: number;
  status: SessionStatus;
}
