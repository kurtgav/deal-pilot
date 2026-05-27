import { Router } from 'express';
import { db } from '../db/schema.js';
import { generateHandoff } from '../services/HandoffGenerator.js';

export const handoffRouter = Router();

handoffRouter.post('/generate', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const lead = db.leads.find((l) => l.id === session.leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const handoff = await generateHandoff(session, lead);
    db.handoffs.push(handoff);

    // Update lead status to SQL if score is high enough
    if (handoff.qualification.score >= 60) {
      lead.status = 'sql';
    }

    res.json(handoff);
  } catch (err: any) {
    console.error('[Handoff] Generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate handoff: ' + err.message });
  }
});

handoffRouter.get('/:sessionId', (req, res) => {
  const handoff = db.handoffs.find((h) => h.sessionId === req.params.sessionId);
  if (!handoff) return res.status(404).json({ error: 'Handoff not found' });
  res.json(handoff);
});
