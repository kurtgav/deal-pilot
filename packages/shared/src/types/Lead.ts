export type LeadStatus = 'new' | 'in_call' | 'sql' | 'disqualified';

export interface Lead {
  id: string;
  contactName: string;
  company: string;
  companyUrl?: string;
  scrapedContext?: string;
  industry: string;
  initialUseCase: string;
  status: LeadStatus;
  createdAt: string;
  lastCallSessionId?: string;
}
