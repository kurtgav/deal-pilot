import type { Lead } from '@dealpilot/shared';
import { db } from './schema.js';

export const seedLeads: Lead[] = [
  {
    id: 'lead-001',
    contactName: 'Sarah Chen',
    company: 'StreamScale',
    industry: 'EdTech',
    initialUseCase: 'Live tutoring voice rooms needing real-time AI moderation',
    status: 'new',
    createdAt: '2026-05-20T09:00:00Z',
  },
  {
    id: 'lead-002',
    contactName: 'Marcus Johnson',
    company: 'FinFlow',
    industry: 'FinTech',
    initialUseCase: 'Voice-based customer onboarding for banking APIs',
    status: 'new',
    createdAt: '2026-05-22T14:30:00Z',
  },
  {
    id: 'lead-003',
    contactName: 'Priya Patel',
    company: 'DevForge',
    industry: 'Developer Tools',
    initialUseCase: 'AI pair programming with voice commands for IDE plugin',
    status: 'new',
    createdAt: '2026-05-25T11:15:00Z',
  },
];

export function seedDatabase() {
  if (db.leads.length === 0) {
    db.leads.push(...seedLeads);
  }
}
