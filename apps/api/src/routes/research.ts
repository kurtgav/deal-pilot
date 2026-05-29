import { Router } from 'express';
import * as repo from '../db/repo.js';
import { callLLM } from '../services/AIAgent.js';
import { scrapeCompanyUrl } from '../services/WebScraper.js';

export const researchRouter = Router();

/**
 * POST /api/research/:leadId
 * Scrapes (or re-scrapes) the lead's company URL and generates AI insights
 * for pre-call preparation.
 */
researchRouter.post('/:leadId', async (req, res) => {
  const lead = await repo.getLead(req.params.leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.companyUrl) return res.status(400).json({ error: 'Lead has no companyUrl' });

  const scraped = await scrapeCompanyUrl(lead.companyUrl);
  await repo.updateLead(lead.id, { scrapedContext: scraped });

  const insights = await generateInsights(lead.company, lead.industry, scraped);

  res.json({ leadId: lead.id, scrapedContext: scraped, insights });
});

/**
 * GET /api/research/:leadId
 * Returns existing scraped context and generates insights without re-scraping.
 */
researchRouter.get('/:leadId', async (req, res) => {
  const lead = await repo.getLead(req.params.leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (!lead.scrapedContext) {
    return res.json({ leadId: lead.id, scrapedContext: null, insights: null });
  }

  const insights = await generateInsights(lead.company, lead.industry, lead.scrapedContext);
  res.json({ leadId: lead.id, scrapedContext: lead.scrapedContext, insights });
});

async function generateInsights(
  company: string,
  industry: string,
  scrapedContext: string,
): Promise<{ summary: string; painPoints: string[]; talkingPoints: string[]; predictedNeeds: string[] }> {
  const system = `You are a sales research analyst. Given scraped website content, produce a JSON object with:
- summary: 1-2 sentence company overview
- painPoints: array of 3 likely pain points based on their business
- talkingPoints: array of 3 conversation openers referencing their business
- predictedNeeds: array of 3 predicted product/service needs

Return ONLY valid JSON. No markdown fences.`;

  const user = `Company: ${company}\nIndustry: ${industry}\n\nScraped content:\n${scrapedContext}`;

  try {
    const raw = await callLLM(system, user);
    const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: `${company} operates in the ${industry} space.`,
      painPoints: ['Scaling challenges', 'Integration complexity', 'Time to market'],
      talkingPoints: [`I noticed ${company} is in ${industry}`, 'Your website mentions some interesting use cases', 'Based on your product offerings'],
      predictedNeeds: ['API integration support', 'Scalable infrastructure', 'Developer-friendly tooling'],
    };
  }
}
