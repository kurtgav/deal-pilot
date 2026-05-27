// VoicePipeline - STT/TTS orchestration
// For MVP: simulates voice pipeline. In production, integrates Deepgram STT + ElevenLabs TTS.

export interface VoiceConfig {
  sttProvider: 'deepgram' | 'mock';
  ttsProvider: 'elevenlabs' | 'mock';
}

export function createVoicePipeline(_config?: Partial<VoiceConfig>) {
  return {
    // In production: streams audio to Deepgram, returns transcript chunks
    async transcribeAudio(_audioBuffer: Buffer): Promise<string> {
      return '[mock transcription]';
    },

    // In production: sends text to ElevenLabs, returns audio URL/buffer
    async synthesizeSpeech(text: string): Promise<string | undefined> {
      if (!process.env.ELEVENLABS_API_KEY) return undefined;
      // Placeholder for ElevenLabs integration
      return undefined;
    },
  };
}
