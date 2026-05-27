import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, TranscriptLine } from '@dealpilot/shared';
import { db } from '../db/schema.js';
import { generateAgentResponse } from '../services/AIAgent.js';
import { extractFields } from '../services/FieldExtractor.js';
import { scoreLeadFromFields } from '../services/LeadScorer.js';

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173' },
  });

  const mutedSessions = new Set<string>();

  io.on('connection', (socket) => {
    let currentSessionId: string | null = null;

    socket.on('session:join', async ({ sessionId }) => {
      currentSessionId = sessionId;
      socket.join(sessionId);

      // Auto-intro: AI introduces itself when session starts
      const session = db.sessions.find((s) => s.id === sessionId);
      if (session && session.status === 'active' && session.transcript.length === 0) {
        const lead = db.leads.find((l) => l.id === session.leadId);
        if (lead) {
          const introText = `Hi ${lead.contactName.split(' ')[0]}, I'm DealPilot AI — your AI sales engineer for today's call. I'm here to understand your needs and see how we can help. To get started, could you tell me a bit about what your team is working on and what brought you to us today?`;
          const aiLine: TranscriptLine = { speaker: 'AI', text: introText, timestamp: new Date().toISOString() };
          session.transcript.push(aiLine);
          io.to(sessionId).emit('transcript:update', aiLine);
          io.to(sessionId).emit('agent:response', { text: introText });
        }
      }
    });

    socket.on('voice:transcript', async ({ text, speaker }) => {
      if (!currentSessionId) return;
      const session = db.sessions.find((s) => s.id === currentSessionId);
      if (!session || session.status === 'ended') return;

      const line: TranscriptLine = { speaker, text, timestamp: new Date().toISOString() };
      session.transcript.push(line);
      io.to(currentSessionId).emit('transcript:update', line);

      // Parallel: extract fields
      extractFields(session.transcript, session.extractedFields).then((delta) => {
        if (Object.keys(delta).length > 0) {
          // Merge delta into session fields
          const f = session.extractedFields;
          if (delta.industry) f.industry = delta.industry;
          if (delta.useCase) f.useCase = delta.useCase;
          if (delta.painPoints) f.painPoints = [...f.painPoints, ...delta.painPoints];
          if (delta.budgetSignal) f.budgetSignal = delta.budgetSignal;
          if (delta.urgency) f.urgency = delta.urgency;
          if (delta.technicalFit) f.technicalFit = delta.technicalFit;
          if (delta.objections) f.objections = [...f.objections, ...delta.objections];
          if (delta.recommendedPackage) f.recommendedPackage = delta.recommendedPackage;
          if (delta.nextStep) f.nextStep = delta.nextStep;
          if (delta.unansweredQuestions) f.unansweredQuestions = [...f.unansweredQuestions, ...delta.unansweredQuestions];

          io.to(currentSessionId!).emit('fields:update', delta);

          const score = scoreLeadFromFields(f);
          session.leadScore = score;
          io.to(currentSessionId!).emit('score:update', { score });
        }
      });

      // Generate AI response if not muted
      if (!mutedSessions.has(currentSessionId) && speaker === 'PROSPECT') {
        const lead = db.leads.find((l) => l.id === session.leadId);
        if (!lead) return;

        try {
          const { text: responseText } = await generateAgentResponse(session, lead, text);
          const aiLine: TranscriptLine = { speaker: 'AI', text: responseText, timestamp: new Date().toISOString() };
          session.transcript.push(aiLine);
          io.to(currentSessionId).emit('transcript:update', aiLine);
          io.to(currentSessionId).emit('agent:response', { text: responseText });
        } catch (err: any) {
          console.error('[AI] Error:', err.message);
          const errorLine: TranscriptLine = { speaker: 'AI', text: `[Error: ${err.message}]`, timestamp: new Date().toISOString() };
          io.to(currentSessionId).emit('transcript:update', errorLine);
        }
      }
    });

    socket.on('agent:mute', ({ sessionId }) => mutedSessions.add(sessionId));
    socket.on('agent:unmute', ({ sessionId }) => mutedSessions.delete(sessionId));

    socket.on('rep:field:override', ({ sessionId, field, value }) => {
      const session = db.sessions.find((s) => s.id === sessionId);
      if (!session) return;
      (session.extractedFields as any)[field] = value;
      io.to(sessionId).emit('fields:update', { [field]: value });
    });
  });

  return io;
}
