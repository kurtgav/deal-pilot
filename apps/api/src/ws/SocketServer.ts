import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ExtractedSalesFields,
  TranscriptLine,
} from '@dealpilot/shared';
import { db } from '../db/schema.js';
import { generateAgentResponse } from '../services/AIAgent.js';
import { extractFields } from '../services/FieldExtractor.js';
import { scoreLeadFromFields } from '../services/LeadScorer.js';

/**
 * Per-session generation state. Prevents overlapping LLM calls when prospect
 * speaks rapidly (e.g. multiple short utterances close together) and lets the
 * frontend distinguish 'thinking' from 'idle'.
 */
interface SessionRuntime {
  generationInFlight: boolean;
  /** Latest prospect text observed; used so the AI always answers the most
   *  recent thing the prospect said, even if a slower turn arrived first. */
  pendingText: string | null;
  pendingTimestamp: number;
}

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173' },
  });

  const mutedSessions = new Set<string>();
  const runtime = new Map<string, SessionRuntime>();

  function getRuntime(sessionId: string): SessionRuntime {
    let r = runtime.get(sessionId);
    if (!r) {
      r = { generationInFlight: false, pendingText: null, pendingTimestamp: 0 };
      runtime.set(sessionId, r);
    }
    return r;
  }

  io.on('connection', (socket) => {
    let currentSessionId: string | null = null;

    socket.on('session:join', async ({ sessionId }) => {
      currentSessionId = sessionId;
      socket.join(sessionId);

      const session = db.sessions.find((s) => s.id === sessionId);
      if (session && session.status === 'active' && session.transcript.length === 0) {
        const lead = db.leads.find((l) => l.id === session.leadId);
        if (lead) {
          let introText: string;
          if (lead.scrapedContext) {
            // Generate a personalized intro using the AI with company context
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
          const aiLine: TranscriptLine = {
            speaker: 'AI',
            text: introText,
            timestamp: new Date().toISOString(),
          };
          session.transcript.push(aiLine);
          io.to(sessionId).emit('transcript:update', aiLine);
          io.to(sessionId).emit('agent:response', { text: introText });
        }
      }
    });

    socket.on('voice:transcript', async ({ text, speaker }) => {
      if (!currentSessionId) return;
      const sessionId = currentSessionId;
      const session = db.sessions.find((s) => s.id === sessionId);
      if (!session || session.status === 'ended') return;

      const cleaned = (text ?? '').trim();
      if (!cleaned) return;

      const line: TranscriptLine = {
        speaker,
        text: cleaned,
        timestamp: new Date().toISOString(),
      };
      session.transcript.push(line);
      io.to(sessionId).emit('transcript:update', line);

      // Field extraction — fire-and-forget, doesn't block the AI response.
      extractFields(session.transcript, session.extractedFields)
        .then((delta) => {
          if (Object.keys(delta).length === 0) return;
          mergeFields(session.extractedFields, delta);
          io.to(sessionId).emit('fields:update', delta);

          const score = scoreLeadFromFields(session.extractedFields);
          session.leadScore = score;
          io.to(sessionId).emit('score:update', { score });
        })
        .catch((err) => {
          console.warn('[FieldExtractor] failed:', err?.message ?? err);
        });

      // Only generate AI replies for prospect speech, and only if not muted.
      if (mutedSessions.has(sessionId) || speaker !== 'PROSPECT') return;

      const lead = db.leads.find((l) => l.id === session.leadId);
      if (!lead) return;

      const r = getRuntime(sessionId);
      // Always remember the latest prospect text — if a generation is in flight
      // we'll consume this when it finishes.
      r.pendingText = cleaned;
      r.pendingTimestamp = Date.now();

      if (r.generationInFlight) {
        // Already generating; the in-flight loop will pick up pendingText.
        return;
      }

      // Start the generation loop. Drains pendingText until empty so rapid
      // prospect turns coalesce into a single fresh response.
      void runGenerationLoop(sessionId);
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

  /**
   * Generate an AI reply for a session, draining pendingText so multiple rapid
   * prospect turns produce one fresh reply (not N parallel ones).
   */
  async function runGenerationLoop(sessionId: string) {
    const r = getRuntime(sessionId);
    if (r.generationInFlight) return;
    r.generationInFlight = true;
    io.to(sessionId).emit('agent:thinking', { sessionId, thinking: true });

    try {
      while (r.pendingText) {
        const text = r.pendingText;
        r.pendingText = null;

        const session = db.sessions.find((s) => s.id === sessionId);
        if (!session || session.status === 'ended') break;
        const lead = db.leads.find((l) => l.id === session.leadId);
        if (!lead) break;

        try {
          const { text: responseText } = await generateAgentResponse(session, lead, text);
          // If a newer turn arrived while we were generating, that turn is now
          // in pendingText — skip emitting this stale answer and loop.
          if (r.pendingText) {
            console.log('[AI] Newer prospect turn arrived during generation — discarding stale response');
            continue;
          }
          const aiLine: TranscriptLine = {
            speaker: 'AI',
            text: responseText,
            timestamp: new Date().toISOString(),
          };
          session.transcript.push(aiLine);
          io.to(sessionId).emit('transcript:update', aiLine);
          io.to(sessionId).emit('agent:response', { text: responseText });
        } catch (err: any) {
          const message = err?.message || 'AI response failed';
          console.error('[AI] Error:', message);
          io.to(sessionId).emit('agent:error', { sessionId, message });
          // Swallow — the rep can keep talking; we don't stop the loop.
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

/**
 * Merge a delta of extracted fields into the session's running fields.
 * - Scalar fields: overwrite with the new value.
 * - Array fields (painPoints / objections / unansweredQuestions): append AND
 *   de-duplicate case-insensitively so the list doesn't grow unbounded.
 */
function mergeFields(target: ExtractedSalesFields, delta: Partial<ExtractedSalesFields>): void {
  if (delta.industry) target.industry = delta.industry;
  if (delta.useCase) target.useCase = delta.useCase;
  if (delta.budgetSignal) target.budgetSignal = delta.budgetSignal;
  if (delta.urgency) target.urgency = delta.urgency;
  if (delta.technicalFit) target.technicalFit = delta.technicalFit;
  if (delta.recommendedPackage) target.recommendedPackage = delta.recommendedPackage;
  if (delta.nextStep) target.nextStep = delta.nextStep;

  if (delta.painPoints?.length) {
    target.painPoints = dedupeAppend(target.painPoints, delta.painPoints);
  }
  if (delta.objections?.length) {
    target.objections = dedupeAppend(target.objections, delta.objections);
  }
  if (delta.unansweredQuestions?.length) {
    target.unansweredQuestions = dedupeAppend(target.unansweredQuestions, delta.unansweredQuestions);
  }
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
