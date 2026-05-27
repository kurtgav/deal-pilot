import { Router } from 'express';
import { synthesizeSpeechElevenLabs } from '../services/VoicePipeline.js';

export const ttsRouter = Router();

/**
 * POST /api/tts
 * Body: { text: string }
 * Returns: audio/mpeg stream
 *
 * English-only synthesis via ElevenLabs.
 */
ttsRouter.post('/', async (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  if (text.length > 2000) {
    return res.status(400).json({ error: 'text too long (max 2000 chars)' });
  }

  try {
    const audioBuffer = await synthesizeSpeechElevenLabs({ text });

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
 * GET /api/tts/health — check if ElevenLabs is configured.
 */
ttsRouter.get('/health', (_req, res) => {
  const configured = !!process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'xxx';
  res.json({
    configured,
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb',
    model: process.env.ELEVENLABS_MODEL || 'eleven_monolingual_v1',
  });
});
