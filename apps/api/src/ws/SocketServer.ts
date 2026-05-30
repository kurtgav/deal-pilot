import { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ExtractedSalesFields,
  TranscriptLine,
  CallSession,
} from '@dealpilot/shared';
import * as repo from '../db/repo.js';
import { supabaseAuth } from '../lib/supabase.js';
import { generateAgentResponse } from '../services/AIAgent.js';
import { extractFields } from '../services/FieldExtractor.js';
import { scoreLeadFromFields } from '../services/LeadScorer.js';
import { createDeepgramStream } from '../services/DeepgramSTT.js';
import { corsOrigins } from '../lib/cors.js';

interface SessionRuntime {
  generationInFlight: boolean;
  pendingText: string | null;
  pendingTimestamp: number;
}

interface SocketData {
  userId: string;
}

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    { cors: { origin: corsOrigins() } },
  );

  // Task 2: authenticate every socket connection via the Supabase JWT.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('unauthorized'));
    try {
      const { data, error } = await supabaseAuth.auth.getUser(token);
      if (error || !data?.user) return next(new Error('unauthorized'));
      socket.data.userId = data.user.id;
      next();
    } catch {
      next(new Error('auth_unavailable'));
    }
  });

  const mutedSessions = new Set<string>();
  const runtime = new Map<string, SessionRuntime>();
  // In-memory cache of active sessions; flushed to Supabase as it mutates.
  const active = new Map<string, CallSession>();

  function getRuntime(sessionId: string): SessionRuntime {
    let r = runtime.get(sessionId);
    if (!r) {
      r = { generationInFlight: false, pendingText: null, pendingTimestamp: 0 };
      runtime.set(sessionId, r);
    }
    return r;
  }

  async function loadSession(sessionId: string): Promise<CallSession | null> {
    let s = active.get(sessionId);
    if (s) return s;
    const fromDb = await repo.getSession(sessionId);
    if (fromDb) active.set(sessionId, fromDb);
    return fromDb;
  }

  const persist = (s: CallSession) => {
    void repo.saveSession(s).catch((e) => console.warn('[session] persist failed:', e?.message ?? e));
  };

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>) => {
    let currentSessionId: string | null = null;
    let dg: ReturnType<typeof createDeepgramStream> | null = null;

    socket.on('session:join', async ({ sessionId }) => {
      // Task 10: enforce session ownership.
      const owner = await repo.getSessionOwner(sessionId);
      if (!owner || owner !== socket.data.userId) {
        socket.emit('agent:error', { sessionId, message: 'Not authorized for this session.' });
        socket.disconnect();
        return;
      }

      currentSessionId = sessionId;
      socket.join(sessionId);

      const session = await loadSession(sessionId);
      if (session && session.status === 'active' && session.transcript.length === 0) {
        const lead = await repo.getLead(session.leadId);
        if (lead) {
          let introText: string;
          if (lead.scrapedContext) {
            try {
              const { text } = await generateAgentResponse(session, lead,
                '[SYSTEM: Generate your opening greeting. Reference something specific about their company to show you did your research.]');
              introText = text;
            } catch {
              introText = `Hi ${lead.contactName.split(' ')[0]}, I'm DealPilot AI — your AI sales engineer. I've done some research on ${lead.company} and I'm excited to explore how we can help. What's the main challenge you're looking to solve?`;
            }
          } else {
            introText = `Hi ${lead.contactName.split(' ')[0]}, I'm DealPilot AI — your AI sales engineer for today's call. I'm here to understand your needs and see how we can help. To get started, could you tell me a bit about what your team is working on?`;
          }
          const aiLine: TranscriptLine = { speaker: 'AI', text: introText, timestamp: new Date().toISOString() };
          session.transcript.push(aiLine);
          persist(session);
          io.to(sessionId).emit('transcript:update', aiLine);
          io.to(sessionId).emit('agent:response', { text: introText });
        }
      }
    });

    // Task 3: stream raw audio chunks into Deepgram. Transcripts loop back
    // through the same handleProspectText path as typed/Web-Speech input.
    socket.on('voice:audio', (chunk: ArrayBuffer) => {
      if (!currentSessionId) return;
      if (!dg) {
        dg = createDeepgramStream((text) => {
          void handleProspectText(currentSessionId!, text, 'PROSPECT');
        });
      }
      dg?.send(chunk);
    });

    socket.on('voice:transcript', async ({ text, speaker }) => {
      if (!currentSessionId) return;
      await handleProspectText(currentSessionId, text, speaker);
    });

    socket.on('agent:mute', ({ sessionId }) => mutedSessions.add(sessionId));
    socket.on('agent:unmute', ({ sessionId }) => mutedSessions.delete(sessionId));

    socket.on('rep:field:override', async ({ sessionId, field, value }) => {
      const session = await loadSession(sessionId);
      if (!session) return;
      (session.extractedFields as any)[field] = value;
      persist(session);
      io.to(sessionId).emit('fields:update', { [field]: value });
    });

    socket.on('disconnect', () => { dg?.close(); dg = null; });
  });

  async function handleProspectText(sessionId: string, text: string, speaker: 'PROSPECT' | 'REP') {
    const session = await loadSession(sessionId);
    if (!session || session.status === 'ended') return;

    const cleaned = (text ?? '').trim();
    if (!cleaned) return;

    const line: TranscriptLine = { speaker, text: cleaned, timestamp: new Date().toISOString() };
    session.transcript.push(line);
    persist(session);
    io.to(sessionId).emit('transcript:update', line);

    // Field extraction — delayed so it doesn't compete with the reply for LLM bandwidth.
    setTimeout(() => {
      extractFields(session.transcript, session.extractedFields)
        .then((delta) => {
          if (Object.keys(delta).length === 0) return;
          mergeFields(session.extractedFields, delta);
          session.leadScore = scoreLeadFromFields(session.extractedFields);
          persist(session);
          io.to(sessionId).emit('fields:update', delta);
          io.to(sessionId).emit('score:update', { score: session.leadScore });
        })
        .catch((err) => console.warn('[FieldExtractor] failed:', err?.message ?? err));
    }, 3000);

    if (mutedSessions.has(sessionId) || speaker !== 'PROSPECT') return;

    const r = getRuntime(sessionId);
    r.pendingText = cleaned;
    r.pendingTimestamp = Date.now();
    if (r.generationInFlight) return;
    void runGenerationLoop(sessionId);
  }

  async function runGenerationLoop(sessionId: string) {
    const r = getRuntime(sessionId);
    if (r.generationInFlight) return;
    r.generationInFlight = true;
    io.to(sessionId).emit('agent:thinking', { sessionId, thinking: true });

    try {
      while (r.pendingText) {
        const text = r.pendingText;
        r.pendingText = null;

        const session = active.get(sessionId);
        if (!session || session.status === 'ended') break;
        const lead = await repo.getLead(session.leadId);
        if (!lead) break;

        try {
          const { text: responseText } = await generateAgentResponse(session, lead, text);
          if (r.pendingText) {
            console.log('[AI] Newer prospect turn arrived during generation — discarding stale response');
            continue;
          }
          const aiLine: TranscriptLine = { speaker: 'AI', text: responseText, timestamp: new Date().toISOString() };
          session.transcript.push(aiLine);
          persist(session);
          io.to(sessionId).emit('transcript:update', aiLine);
          io.to(sessionId).emit('agent:response', { text: responseText });
        } catch (err: any) {
          const message = err?.message || 'AI response failed';
          console.error('[AI] Error:', message);
          io.to(sessionId).emit('agent:error', { sessionId, message });
        }
      }
    } finally {
      r.generationInFlight = false;
      io.to(sessionId).emit('agent:thinking', { sessionId, thinking: false });
    }
  }

  return io;
}

// ---------- Helpers ----------

function mergeFields(target: ExtractedSalesFields, delta: Partial<ExtractedSalesFields>): void {
  if (delta.industry) target.industry = delta.industry;
  if (delta.useCase) target.useCase = delta.useCase;
  if (delta.budgetSignal) target.budgetSignal = delta.budgetSignal;
  if (delta.urgency) target.urgency = delta.urgency;
  if (delta.technicalFit) target.technicalFit = delta.technicalFit;
  if (delta.recommendedPackage) target.recommendedPackage = delta.recommendedPackage;
  if (delta.nextStep) target.nextStep = delta.nextStep;

  if (delta.painPoints?.length) target.painPoints = dedupeAppend(target.painPoints, delta.painPoints);
  if (delta.objections?.length) target.objections = dedupeAppend(target.objections, delta.objections);
  if (delta.unansweredQuestions?.length)
    target.unansweredQuestions = dedupeAppend(target.unansweredQuestions, delta.unansweredQuestions);
}

function dedupeAppend(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((x) => x.trim().toLowerCase()));
  const out = [...existing];
  for (const item of incoming) {
    const k = item.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item.trim());
  }
  return out;
}
