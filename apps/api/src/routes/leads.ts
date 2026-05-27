import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import type { Lead, LeadStatus } from '@dealpilot/shared';
import { db } from '../db/schema.js';

export const leadsRouter = Router();

leadsRouter.get('/', (_req, res) => {
  res.json(db.leads);
});

leadsRouter.post('/', (req, res) => {
  const { contactName, company, industry, initialUseCase } = req.body;
  const lead: Lead = {
    id: uuid(),
    contactName,
    company,
    industry,
    initialUseCase,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  db.leads.push(lead);
  res.status(201).json(lead);
});

leadsRouter.get('/:id', (req, res) => {
  const lead = db.leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

leadsRouter.patch('/:id/status', (req, res) => {
  const lead = db.leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  lead.status = req.body.status as LeadStatus;
  res.json(lead);
});
