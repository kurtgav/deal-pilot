import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import type { CallSession } from '@dealpilot/shared';
import { db } from '../db/schema.js';

export const sessionsRouter = Router();

sessionsRouter.post('/start', (req, res) => {
  const { leadId } = req.body;
  const lead = db.leads.find((l) => l.id === leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const session: CallSession = {
    id: uuid(),
    leadId,
    startedAt: new Date().toISOString(),
    transcript: [],
    extractedFields: { painPoints: [], objections: [], unansweredQuestions: [] },
    status: 'active',
  };
  db.sessions.push(session);
  lead.status = 'in_call';
  lead.lastCallSessionId = session.id;
  res.status(201).json(session);
});

sessionsRouter.patch('/:id/end', (req, res) => {
  const session = db.sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.status = 'ended';
  session.endedAt = new Date().toISOString();
  res.json(session);
});

sessionsRouter.get('/:id', (req, res) => {
  const session = db.sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});
