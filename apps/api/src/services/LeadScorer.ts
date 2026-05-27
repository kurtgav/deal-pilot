import type { ExtractedSalesFields } from '@dealpilot/shared';

// Weighted scoring per PRD spec
const WEIGHTS = {
  useCase: 20,
  technicalFit: 20,
  urgency: 20,
  budgetSignal: 15,
  decisionMaker: 15,
  objectionSeverity: 10,
};

function signalScore(value: string | undefined, map: Record<string, number>): number {
  if (!value || value === 'Unknown') return 0.3;
  return map[value] ?? 0.3;
}

export function scoreLeadFromFields(fields: ExtractedSalesFields): number {
  const useCaseScore = fields.useCase ? 1 : 0.2;
  const techFit = signalScore(fields.technicalFit, { Strong: 1, Moderate: 0.6, Weak: 0.2 });
  const urgency = signalScore(fields.urgency, { High: 1, Medium: 0.6, Low: 0.2 });
  const budget = signalScore(fields.budgetSignal, { High: 1, Medium: 0.6, Low: 0.2 });
  const decisionMaker = fields.painPoints.length > 0 ? 0.7 : 0.3;
  const objSeverity = fields.objections.length === 0 ? 1 : Math.max(0.3, 1 - fields.objections.length * 0.2);

  const raw =
    WEIGHTS.useCase * useCaseScore +
    WEIGHTS.technicalFit * techFit +
    WEIGHTS.urgency * urgency +
    WEIGHTS.budgetSignal * budget +
    WEIGHTS.decisionMaker * decisionMaker +
    WEIGHTS.objectionSeverity * objSeverity;

  return Math.min(100, Math.round(raw));
}

export function getDealStage(score: number) {
  if (score >= 80) return 'Sales Qualified Lead' as const;
  if (score >= 60) return 'Marketing Qualified Lead' as const;
  if (score >= 40) return 'Needs Review' as const;
  return 'Needs Review' as const;
}
