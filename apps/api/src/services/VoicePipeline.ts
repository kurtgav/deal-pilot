// VoicePipeline — TTS orchestration (English only).
// ElevenLabs is used for natural-sounding voice; client falls back to browser
// SpeechSynthesis if ElevenLabs is unavailable.

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Default voice: George (warm, professional male). Override via env.
const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';
// eleven_monolingual_v1 is fine for English; multilingual is unnecessary now.
const DEFAULT_MODEL = 'eleven_monolingual_v1';

export interface TTSOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
}

/**
 * Synthesize speech using ElevenLabs API (English).
 * Returns an mpeg audio Buffer that can be streamed to the client, or null
 * if ElevenLabs is not configured / the request fails.
 */
export async function synthesizeSpeechElevenLabs(opts: TTSOptions): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'xxx') {
    console.warn('[ElevenLabs] ELEVENLABS_API_KEY not configured');
    return null;
  }

  const voiceId = opts.voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const modelId = opts.modelId || process.env.ELEVENLABS_MODEL || DEFAULT_MODEL;

  const requestBody = {
    text: opts.text,
    model_id: modelId,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.3,
      use_speaker_boost: true,
    },
  };

  try {
    console.log(
      `[ElevenLabs] Synthesizing with voice ${voiceId.slice(0, 8)}… text:`,
      opts.text.slice(0, 60),
    );
    const res = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[ElevenLabs] API error:', res.status, errText);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    console.log(`[ElevenLabs] Got ${arrayBuffer.byteLength} bytes of audio`);
    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    console.error('[ElevenLabs] Request failed:', err.message);
    return null;
  }
}

// Legacy interface kept so any older imports keep working.
export interface VoiceConfig {
  sttProvider: 'deepgram' | 'mock';
  ttsProvider: 'elevenlabs' | 'mock';
}

export function createVoicePipeline(_config?: Partial<VoiceConfig>) {
  return {
    async transcribeAudio(_audioBuffer: Buffer): Promise<string> {
      return '[mock transcription]';
    },
    async synthesizeSpeech(text: string): Promise<Buffer | null> {
      return synthesizeSpeechElevenLabs({ text });
    },
  };
}
