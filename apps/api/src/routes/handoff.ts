import { Router } from 'express';
import * as repo from '../db/repo.js';
import { generateHandoff } from '../services/HandoffGenerator.js';

export const handoffRouter = Router();

handoffRouter.get('/', async (req, res) => {
  res.json(await repo.listHandoffs(req.user!.id));
});

handoffRouter.post('/generate', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const session = await repo.getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const lead = await repo.getLead(session.leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const handoff = await generateHandoff(session, lead);
    await repo.createHandoff(handoff, req.user!.id);

    if (handoff.qualification.score >= 60) {
      await repo.updateLead(lead.id, { status: 'sql' });
    }

    res.json(handoff);
  } catch (err: any) {
    console.error('[Handoff] Generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate handoff: ' + err.message });
  }
});

handoffRouter.get('/:sessionId', async (req, res) => {
  const handoff = await repo.getHandoff(req.params.sessionId);
  if (!handoff) return res.status(404).json({ error: 'Handoff not found' });
  res.json(handoff);
});
