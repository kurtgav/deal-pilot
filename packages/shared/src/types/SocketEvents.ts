import type { TranscriptLine, ExtractedSalesFields } from './Session.js';

/** Per-turn latency breakdown (ms). Fields are optional because different
 *  stages are measured in different places (STT/TTS client-side, LLM server). */
export interface LatencyUpdate {
  sessionId: string;
  stt_ms?: number;
  llm_ms?: number;
  tts_ms?: number;
  total_ms?: number;
}

export interface ClientToServerEvents {
  'session:join': (payload: { sessionId: string }) => void;
  'voice:transcript': (payload: { text: string; speaker: 'PROSPECT' | 'REP' }) => void;
  'voice:audio': (chunk: ArrayBuffer) => void;
  'agent:mute': (payload: { sessionId: string }) => void;
  'agent:unmute': (payload: { sessionId: string }) => void;
  'rep:field:override': (payload: { sessionId: string; field: string; value: string }) => void;
}

export interface ServerToClientEvents {
  'transcript:update': (payload: TranscriptLine) => void;
  'fields:update': (payload: Partial<ExtractedSalesFields>) => void;
  'score:update': (payload: { score: number }) => void;
  'agent:response': (payload: { text: string; audioUrl?: string }) => void;
  'agent:thinking': (payload: { sessionId: string; thinking: boolean }) => void;
  'agent:error': (payload: { sessionId: string; message: string }) => void;
  'latency:update': (payload: LatencyUpdate) => void;
  'session:ended': (payload: { sessionId: string }) => void;
}
