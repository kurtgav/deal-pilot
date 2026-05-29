import { describe, it, expect } from 'vitest';
import { scoreLeadFromFields, getDealStage } from './LeadScorer.js';

describe('LeadScorer', () => {
  it('scores a strong, urgent, high-budget lead as a high SQL', () => {
    const score = scoreLeadFromFields({
      useCase: 'Voice AI for discovery calls',
      technicalFit: 'Strong',
      urgency: 'High',
      budgetSignal: 'High',
      painPoints: ['Losing technical prospects'],
      objections: [],
      unansweredQuestions: [],
    });
    expect(score).toBeGreaterThanOrEqual(80);
    expect(getDealStage(score)).toBe('Sales Qualified Lead');
  });

  it('scores an empty/unknown lead low', () => {
    const score = scoreLeadFromFields({ painPoints: [], objections: [], unansweredQuestions: [] });
    expect(score).toBeLessThan(60);
  });

  it('caps the score at 100 and maps stage thresholds', () => {
    expect(getDealStage(85)).toBe('Sales Qualified Lead');
    expect(getDealStage(65)).toBe('Marketing Qualified Lead');
    expect(getDealStage(45)).toBe('Needs Review');
    expect(getDealStage(10)).toBe('Needs Review');
  });
});
