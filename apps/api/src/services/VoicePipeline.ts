// VoicePipeline - STT/TTS orchestration
// ElevenLabs TTS integration with multilingual support (including Filipino)

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Default voice: George (JBFqnCBsd6RMkjVDRZzb) - warm British male, VERIFIED Filipino (fil-PH) support
const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';
const DEFAULT_MODEL = 'eleven_multilingual_v2'; // Required for Filipino support

export interface TTSOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  language?: 'en' | 'fil';
}

/**
 * Synthesize speech using ElevenLabs API.
 * Returns audio buffer (mpeg) that can be streamed to client.
 * Uses eleven_multilingual_v2 model for Filipino/Tagalog support.
 */
export async function synthesizeSpeechElevenLabs(opts: TTSOptions): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'xxx') {
    console.warn('[ElevenLabs] ELEVENLABS_API_KEY not configured');
    return null;
  }

  const voiceId = opts.voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const modelId = opts.modelId || process.env.ELEVENLABS_MODEL || DEFAULT_MODEL;

  // Voice settings: young 25yo professional Filipino speaker - crisp, confident, modern
  const isFilipino = opts.language === 'fil';
  const voiceSettings = isFilipino
    ? {
        stability: 0.40,        // Expressive but controlled - young professional energy
        similarity_boost: 0.88, // Consistent voice identity
        style: 0.65,            // Strong native Tagalog cadence, modern delivery
        use_speaker_boost: true,
      }
    : {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      };

  const requestBody = {
    text: opts.text,
    model_id: modelId,
    voice_settings: voiceSettings,
    // Force Filipino language for proper Tagalog accent and phoneme handling
    ...(isFilipino && { language_code: 'fil' }),
  };

  try {
    console.log(`[ElevenLabs] Synthesizing (${opts.language}) with voice ${voiceId.slice(0, 8)}... text:`, opts.text.slice(0, 60));
    const res = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
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

/**
 * Detect Filipino/Tagalog text for proper voice settings.
 */
export function detectLanguage(text: string): 'en' | 'fil' {
  const filipinoMarkers = /\b(ako|ikaw|kayo|kami|tayo|sila|niya|natin|namin|ninyo|nila|ang|ng|sa|mga|hindi|oo|opo|po|kasi|kaya|naman|talaga|paano|bakit|saan|kailan|sino|ano|alin|ilan|magkano|salamat|maganda|magandang|umaga|tanghali|hapon|gabi|gusto|ayaw|pwede|puwede|sige|meron|mayroon|wala|nasaan|tulungan|gawin|ginagawa|gagawin|yung|tapos|kelan|tungkol|kahit|para|pero|kung|noong|ngayon|bukas|kahapon|mahal|mura|presyo|tao|trabaho|salamat|kumusta|paalam)\b/i;
  return filipinoMarkers.test(text) ? 'fil' : 'en';
}

// Legacy interface kept for compatibility
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
      return synthesizeSpeechElevenLabs({ text, language: detectLanguage(text) });
    },
  };
}
