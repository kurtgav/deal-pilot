import { Router } from 'express';
import * as repo from '../db/repo.js';

export const sessionsRouter = Router();

sessionsRouter.post('/start', async (req, res) => {
  const { leadId } = req.body;
  const lead = await repo.getLead(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const session = await repo.createSession(leadId, req.user!.id);
  await repo.updateLead(leadId, { status: 'in_call', lastCallSessionId: session.id });
  res.status(201).json(session);
});

sessionsRouter.patch('/:id/end', async (req, res) => {
  const session = await repo.endSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

sessionsRouter.get('/:id', async (req, res) => {
  const session = await repo.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});
