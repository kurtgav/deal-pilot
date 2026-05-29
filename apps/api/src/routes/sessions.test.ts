import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock the data layer so the route is tested in isolation (no DB).
const repo = {
  getLead: vi.fn(),
  createSession: vi.fn(),
  updateLead: vi.fn(),
  endSession: vi.fn(),
  getSession: vi.fn(),
};
vi.mock('../db/repo.js', () => repo);

const { sessionsRouter } = await import('./sessions.js');

function makeApp() {
  const app = express();
  app.use(express.json());
  // Stub auth: inject a fixed user like requireAuth would.
  app.use((req, _res, next) => { (req as any).user = { id: 'user-1' }; next(); });
  app.use('/api/sessions', sessionsRouter);
  return app;
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/sessions/start', () => {
  it('creates a session for an existing lead and marks it in_call', async () => {
    repo.getLead.mockResolvedValue({ id: 'lead-1', contactName: 'A' });
    repo.createSession.mockResolvedValue({ id: 'sess-1', leadId: 'lead-1', status: 'active' });
    repo.updateLead.mockResolvedValue({});

    const res = await request(makeApp()).post('/api/sessions/start').send({ leadId: 'lead-1' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('sess-1');
    expect(repo.createSession).toHaveBeenCalledWith('lead-1', 'user-1');
    expect(repo.updateLead).toHaveBeenCalledWith('lead-1', { status: 'in_call', lastCallSessionId: 'sess-1' });
  });

  it('returns 404 when the lead does not exist', async () => {
    repo.getLead.mockResolvedValue(null);
    const res = await request(makeApp()).post('/api/sessions/start').send({ leadId: 'missing' });
    expect(res.status).toBe(404);
    expect(repo.createSession).not.toHaveBeenCalled();
  });
});
