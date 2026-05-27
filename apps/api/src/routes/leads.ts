import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import type { Lead, LeadStatus } from '@dealpilot/shared';
import { db } from '../db/schema.js';
import { scrapeCompanyUrl } from '../services/WebScraper.js';

export const leadsRouter = Router();

leadsRouter.get('/', (_req, res) => {
  res.json(db.leads);
});

leadsRouter.post('/', async (req, res) => {
  const { contactName, company, companyUrl, industry, initialUseCase } = req.body;
  const lead: Lead = {
    id: uuid(),
    contactName,
    company: company || '',
    companyUrl,
    industry,
    initialUseCase,
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  // Scrape company URL in background — don't block lead creation
  if (companyUrl) {
    scrapeCompanyUrl(companyUrl).then((context) => {
      lead.scrapedContext = context;
      // Extract company name from scraped content if not provided
      if (!lead.company) {
        const nameMatch = context.match(/^Company:\s*(.+)/m);
        if (nameMatch) lead.company = nameMatch[1].split('|')[0].split('-')[0].trim();
      }
    }).catch(() => {});
  }

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
