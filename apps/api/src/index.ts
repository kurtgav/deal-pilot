import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initSocketServer } from './ws/SocketServer.js';
import { leadsRouter } from './routes/leads.js';
import { sessionsRouter } from './routes/sessions.js';
import { handoffRouter } from './routes/handoff.js';
import { agoraRouter } from './routes/agora.js';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/leads', leadsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/handoff', handoffRouter);
app.use('/api/agora', agoraRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

initSocketServer(httpServer);

import { seedDatabase } from './db/seedData.js';
seedDatabase();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`DealPilot API running on :${PORT}`));
