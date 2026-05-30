import { describe, it, expect, beforeAll } from 'vitest';
import { loadKnowledgeFromObjects, assessProductGrounding } from './RAGService.js';

beforeAll(() => {
  loadKnowledgeFromObjects(
    [
      { name: 'DealPilot Starter', price: '$499/mo', features: ['Up to 50 AI-assisted calls/month', 'CRM CSV export'], bestFor: 'Early-stage startups', integrations: ['REST API', 'Webhooks'] },
      { name: 'DealPilot Professional', price: '$1,499/mo', features: ['Unlimited calls', 'Slack integration'], bestFor: 'Growth-stage SaaS', integrations: ['Slack', 'Salesforce', 'HubSpot'] },
      { name: 'DealPilot Enterprise', price: 'Custom pricing', features: ['SOC 2 compliance', 'SSO/SAML', '99.9% SLA'], bestFor: 'Enterprise orgs', integrations: ['Pipedrive', 'Custom CRM'] },
    ],
    [],
    [],
  );
});

describe('assessProductGrounding', () => {
  it('grounds an in-KB question and returns context', () => {
    const g = assessProductGrounding('Is there a Slack integration?');
    expect(g.grounded).toBe(true);
    expect(g.context).toContain('Professional');
  });

  it('flags an out-of-KB question as ungrounded (no fabrication)', () => {
    for (const q of [
      'Can you sign a HIPAA business associate agreement?',
      'Do you integrate with Microsoft Dynamics 365?',
      'Do you support on-premise deployment in our own AWS account?',
    ]) {
      const g = assessProductGrounding(q);
      expect(g.grounded, q).toBe(false);
      expect(g.context, q).toBe('');
    }
  });

  it('treats a bare greeting as grounded (catalogue overview, not a fabrication risk)', () => {
    const g = assessProductGrounding('hi there');
    expect(g.grounded).toBe(true);
  });
});
