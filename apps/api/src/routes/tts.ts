import { Router } from 'express';
import { synthesizeSpeechElevenLabs, detectLanguage } from '../services/VoicePipeline.js';

export const ttsRouter = Router();

/**
 * POST /api/tts
 * Body: { text: string, language?: 'en' | 'fil' }
 * Returns: audio/mpeg stream
 *
 * Uses ElevenLabs eleven_multilingual_v2 for smooth Filipino + English synthesis.
 */
ttsRouter.post('/', async (req, res) => {
  const { text, language } = req.body as { text?: string; language?: 'en' | 'fil' };

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  if (text.length > 2000) {
    return res.status(400).json({ error: 'text too long (max 2000 chars)' });
  }

  // Auto-detect language if not provided (helps voice tuning)
  const detectedLang = language || detectLanguage(text);

  try {
    const audioBuffer = await synthesizeSpeechElevenLabs({
      text,
      language: detectedLang,
    });

    if (!audioBuffer) {
      return res.status(503).json({
        error: 'TTS service unavailable. Check ELEVENLABS_API_KEY configuration.',
      });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache');
    res.send(audioBuffer);
  } catch (err: any) {
    console.error('[TTS Route] Error:', err.message);
    res.status(500).json({ error: 'TTS synthesis failed' });
  }
});

/**
 * GET /api/tts/health - check if ElevenLabs is configured
 */
ttsRouter.get('/health', (_req, res) => {
  const configured = !!process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'xxx';
  res.json({
    configured,
    voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
    model: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
  });
});
