import { Router } from 'express';
import * as repo from '../db/repo.js';
import { recordConsent } from '../services/consent.js';
import { denyIfNotOwner } from '../lib/ownership.js';

export const sessionsRouter = Router();

/** Prospect's explicit opt-in to talk with an AI. Logged with a hashed IP and
 *  no raw PII. The frontend must call this before enabling mic capture. */
sessionsRouter.post('/:id/consent', async (req, res) => {
  const owner = await repo.getSessionOwner(req.params.id);
  if (denyIfNotOwner(res, owner, req.user!.id)) return;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const record = recordConsent(req.params.id, ip);
  res.status(201).json({ consentedAt: record.consentedAt });
});

sessionsRouter.post('/start', async (req, res) => {
  const { leadId } = req.body;
  if (denyIfNotOwner(res, await repo.getLeadOwner(leadId), req.user!.id, true)) return;

  const session = await repo.createSession(leadId, req.user!.id);
  await repo.updateLead(leadId, { status: 'in_call', lastCallSessionId: session.id });
  res.status(201).json(session);
});

sessionsRouter.patch('/:id/end', async (req, res) => {
  if (denyIfNotOwner(res, await repo.getSessionOwner(req.params.id), req.user!.id)) return;
  const session = await repo.endSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

sessionsRouter.get('/:id', async (req, res) => {
  if (denyIfNotOwner(res, await repo.getSessionOwner(req.params.id), req.user!.id)) return;
  const session = await repo.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});
