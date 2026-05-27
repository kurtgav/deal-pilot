import 'dotenv/config';
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

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/leads', leadsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/handoff', handoffRouter);
app.use('/api/agora', agoraRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/research', researchRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

initSocketServer(httpServer);

import { seedDatabase } from './db/seedData.js';
seedDatabase();

const PORT = process.env.PORT || 3001;
httpServer.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Run: lsof -ti:${PORT} | xargs kill -9`);
    process.exit(1);
  }
  throw err;
});
httpServer.listen(PORT, () => console.log(`DealPilot API running on :${PORT}`));
