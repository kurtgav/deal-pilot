import { describe, it, expect, vi } from 'vitest';
import type { LanguageModel, SpeechToText, TextToSpeech } from './providers.js';

// Mock vendors so the abstraction is tested without network calls.
vi.mock('./AIAgent.js', () => ({ callLLM: vi.fn(async () => 'hello from llm') }));
vi.mock('./DeepgramSTT.js', () => ({ createDeepgramStream: (cb: (t: string) => void) => ({ send: () => cb('final text'), close: () => {} }) }));
vi.mock('./VoicePipeline.js', () => ({ synthesizeSpeechElevenLabs: vi.fn(async () => Buffer.from('audio')) }));

const { languageModel, speechToText, textToSpeech } = await import('./providers.js');

/** A turn driven purely through the interfaces, capturing per-stage latency. */
async function runTurn(lm: LanguageModel, stt: SpeechToText, tts: TextToSpeech) {
  const timings: Record<string, number> = {};
  let transcript = '';
  const t0 = Date.now();
  const stream = stt.stream((t) => { transcript = t; });
  stream.send(new ArrayBuffer(0));
  timings.stt_ms = Date.now() - t0;

  const t1 = Date.now();
  const reply = await lm.complete('sys', transcript);
  timings.llm_ms = Date.now() - t1;

  const t2 = Date.now();
  const audio = await tts.synthesize(reply);
  timings.tts_ms = Date.now() - t2;
  return { transcript, reply, audio, timings };
}

describe('vendor abstraction', () => {
  it('drives a turn through the interfaces and records timings', async () => {
    const { transcript, reply, audio, timings } = await runTurn(languageModel, speechToText, textToSpeech);
    expect(transcript).toBe('final text');
    expect(reply).toBe('hello from llm');
    expect(audio).toBeInstanceOf(Buffer);
    for (const k of ['stt_ms', 'llm_ms', 'tts_ms']) {
      expect(timings[k]).toBeGreaterThanOrEqual(0);
    }
  });
});
