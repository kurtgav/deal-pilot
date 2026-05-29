import { Router } from 'express';
import type { LeadStatus } from '@dealpilot/shared';
import * as repo from '../db/repo.js';
import { scrapeCompanyUrl } from '../services/WebScraper.js';

export const leadsRouter = Router();

leadsRouter.get('/', async (req, res) => {
  res.json(await repo.listLeads(req.user!.id));
});

leadsRouter.post('/', async (req, res) => {
  const { contactName, companyUrl, industry, initialUseCase } = req.body;
  let company = req.body.company || '';

  let scrapedContext: string | undefined;
  if (companyUrl) {
    scrapedContext = await scrapeCompanyUrl(companyUrl);
    if (!company) {
      const nameMatch = scrapedContext.match(/^Company:\s*(.+)/m);
      if (nameMatch) company = nameMatch[1].split('|')[0].split('-')[0].trim();
    }
  }

  const lead = await repo.createLead({
    userId: req.user!.id,
    contactName,
    company,
    companyUrl,
    scrapedContext,
    industry,
    initialUseCase,
  });
  res.status(201).json(lead);
});

leadsRouter.get('/:id', async (req, res) => {
  const lead = await repo.getLead(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

leadsRouter.patch('/:id/status', async (req, res) => {
  const lead = await repo.updateLead(req.params.id, { status: req.body.status as LeadStatus });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});
