import './env.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initSocketServer } from './ws/SocketServer.js';
import { leadsRouter } from './routes/leads.js';
import { sessionsRouter } from './routes/sessions.js';
import { handoffRouter } from './routes/handoff.js';
import { agoraRouter } from './routes/agora.js';
import { ttsRouter } from './routes/tts.js';
import { researchRouter } from './routes/research.js';
import { knowledgeRouter } from './routes/knowledge.js';
import { adminRouter } from './routes/admin.js';
import { loadKnowledge } from './services/RAGService.js';
import { requireAuth } from './middleware/auth.js';
import { corsOrigins } from './lib/cors.js';
import { rateLimit } from './lib/rateLimit.js';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: corsOrigins() }));
app.use(express.json());

// Public endpoints (no auth required)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Rate limit all API traffic (request flood + LLM cost protection).
app.use('/api', rateLimit({ windowMs: 60_000, max: 120 }));

// Protected endpoints — every route below requires a valid Supabase JWT.
// Individual routers can layer requirePermission()/requireRole() on top
// for fine-grained access control.
app.use('/api/leads', requireAuth, leadsRouter);
app.use('/api/sessions', requireAuth, sessionsRouter);
app.use('/api/handoff', requireAuth, handoffRouter);
app.use('/api/agora', requireAuth, agoraRouter);
app.use('/api/tts', requireAuth, ttsRouter);
app.use('/api/research', requireAuth, researchRouter);
app.use('/api/knowledge', requireAuth, knowledgeRouter);
app.use('/api/admin', requireAuth, adminRouter);

// Global error handler: never leak stack traces to clients; log server-side.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err?.stack ?? err);
  if (res.headersSent) return;
  res.status(err?.status ?? 500).json({ error: 'Internal server error' });
});

// Don't crash the process on an unhandled async rejection; log and continue.
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

initSocketServer(httpServer);

// Warm the in-memory knowledge cache used by the AI agent for RAG.
loadKnowledge().catch((e) => console.warn('[RAG] initial load failed:', e?.message ?? e));

const PORT = process.env.PORT || 3001;
httpServer.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Run: lsof -ti:${PORT} | xargs kill -9`);
    process.exit(1);
  }
  throw err;
});
httpServer.listen(PORT, () => console.log(`DealPilot API running on :${PORT}`));
