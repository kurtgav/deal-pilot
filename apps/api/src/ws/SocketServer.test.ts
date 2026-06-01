import { describe, it, expect, vi, afterEach } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { io as ioClient, type Socket } from 'socket.io-client';
import type { CallSession, SessionSnapshot } from '@dealpilot/shared';

// A session as it would be PERSISTED in Postgres mid-call (the DB is the
// source of truth that must survive reconnect / server restart).
const PERSISTED: CallSession = {
  id: 'sess-1',
  leadId: 'lead-1',
  startedAt: '2026-01-01T00:00:00.000Z',
  status: 'active',
  transcript: [
    { speaker: 'AI', text: 'Hi, I am DealPilot AI.', timestamp: '2026-01-01T00:00:01.000Z' },
    { speaker: 'PROSPECT', text: 'We need real-time voice rooms.', timestamp: '2026-01-01T00:00:05.000Z' },
  ],
  extractedFields: { useCase: 'Voice rooms', painPoints: ['latency'], objections: [], unansweredQuestions: [] },
  leadScore: 72,
};

// Mock the DB layer: getSession returns the persisted session regardless of
// in-memory cache, so a fresh server instance == a cold restart reading the DB.
vi.mock('../db/repo.js', () => ({
  getSessionOwner: vi.fn(async () => 'user-1'),
  getSession: vi.fn(async () => PERSISTED),
  getLead: vi.fn(async () => null),
  saveSession: vi.fn(async () => {}),
}));

// Mock auth so any token resolves to user-1 (matches the session owner).
vi.mock('../lib/supabase.js', () => ({
  supabaseAuth: { auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })) } },
  supabaseAdmin: {},
}));

const { initSocketServer } = await import('./SocketServer.js');

const servers: HttpServer[] = [];
const clients: Socket[] = [];

afterEach(() => {
  clients.splice(0).forEach((c) => c.disconnect());
  servers.splice(0).forEach((s) => s.close());
});

/** Boot a fresh socket server (fresh in-memory cache) on an ephemeral port. */
async function bootServer(): Promise<number> {
  const httpServer = createServer();
  servers.push(httpServer);
  initSocketServer(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  return (httpServer.address() as AddressInfo).port;
}

/** Join a session and resolve with the replayed state snapshot. */
function joinAndSnapshot(port: number): Promise<SessionSnapshot> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}`, { auth: { token: 't' }, forceNew: true });
    clients.push(socket);
    const timer = setTimeout(() => reject(new Error('no snapshot received')), 4000);
    socket.on('state:snapshot', (snap: SessionSnapshot) => { clearTimeout(timer); resolve(snap); });
    socket.on('connect_error', (e) => { clearTimeout(timer); reject(e); });
    socket.on('connect', () => socket.emit('session:join', { sessionId: 'sess-1' }));
  });
}

describe('call state durability', () => {
  it('replays full DB-backed state to a joining client', async () => {
    const port = await bootServer();
    const snap = await joinAndSnapshot(port);
    expect(snap.transcript).toHaveLength(2);
    expect(snap.fields.useCase).toBe('Voice rooms');
    expect(snap.score).toBe(72);
    expect(snap.status).toBe('active');
  });

  it('survives a socket reconnect (rejoining client gets the same state)', async () => {
    const port = await bootServer();
    const first = await joinAndSnapshot(port);
    clients.splice(0).forEach((c) => c.disconnect()); // drop the socket
    const second = await joinAndSnapshot(port); // brand-new socket rejoins
    expect(second.transcript).toEqual(first.transcript);
    expect(second.score).toBe(first.score);
  });

  it('cold-rehydrates from the DB after a server restart (fresh cache)', async () => {
    const port = await bootServer(); // fresh instance => empty in-memory cache
    const snap = await joinAndSnapshot(port);
    expect(snap.transcript).toHaveLength(2);
    expect(snap.score).toBe(72); // came from repo.getSession, not memory
  });
});
