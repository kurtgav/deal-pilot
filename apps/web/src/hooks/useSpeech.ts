import { useRef, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type SpeechMode = 'manual' | 'continuous';

interface UseSpeechOptions {
  onTranscript: (text: string) => void;
  /**
   * Recognition language (BCP-47). English-only for this version, e.g. 'en-US'.
   */
  lang?: string;
  /**
   * Milliseconds of silence after which the mic auto-stops.
   * Defaults to 2000ms. Set to 0 to disable auto-stop.
   */
  silenceTimeoutMs?: number;
  /**
   * Speech synthesis playback rate (0.5–3). Default 1.
   * For ElevenLabs audio playback this updates live via `playbackRate`
   * (with `preservesPitch` so 1.5x/2x stay natural-sounding).
   * For browser SpeechSynthesis fallback, mid-utterance changes restart
   * the current line at the new rate (Web Speech API limitation).
   */
  rate?: number;
  /**
   * Transcript dispatch mode.
   * - 'manual'      → onTranscript fires on every FINAL recognition result.
   * - 'continuous'  → finals are buffered into a single turn; onTranscript
   *                   fires ONCE when the mic stops (silence or manual).
   *                   Required for closed-loop conversational mode.
   */
  mode?: SpeechMode;
  /**
   * STT transport.
   * - 'browser'  → Web Speech API SpeechRecognition (Chrome-only).
   * - 'deepgram' → capture mic via MediaRecorder and stream chunks to the
   *                server (cross-browser). Transcripts arrive over the socket,
   *                so onTranscript does NOT fire in this mode.
   */
  transport?: 'browser' | 'deepgram';
  /** Called with each audio chunk when transport === 'deepgram'. */
  onAudioChunk?: (chunk: ArrayBuffer) => void;
  /**
   * Barge-in: keep the mic live while the AI speaks so the prospect can
   * interrupt. When real (non-echo) speech is detected mid-utterance, the AI's
   * TTS is cancelled and the turn proceeds. Best with headphones — open
   * speakers can echo the AI voice back into the mic.
   */
  allowBargeIn?: boolean;
}

interface StopOptions {
  /** When true (default) any buffered text in continuous mode is flushed. */
  flush?: boolean;
}

const MIN_RATE = 0.5;
const MAX_RATE = 3;

function clampRate(r: number): number {
  if (Number.isNaN(r)) return 1;
  return Math.min(MAX_RATE, Math.max(MIN_RATE, r));
}

/** Heuristic echo guard for barge-in: is the heard text just the AI's own
 *  spoken words bleeding back into the mic? If most heard words appear in the
 *  AI's current utterance, treat it as echo (not a real interruption). */
function isLikelyEcho(heard: string, aiText: string): boolean {
  if (!aiText) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  const heardWords = norm(heard);
  if (heardWords.length === 0) return true;
  const aiWords = new Set(norm(aiText));
  const overlap = heardWords.filter((w) => aiWords.has(w)).length;
  return overlap / heardWords.length >= 0.6;
}

// ---------- Voice pre-loading (browser TTS) ----------
// Chrome loads SpeechSynthesis voices async; pre-touching getVoices() and
// listening for `voiceschanged` cuts the first-utterance latency noticeably.
let voicesPreloadStarted = false;

// Cache ElevenLabs availability across turns. Once we learn the server has no
// TTS configured (or it's too slow), skip the round-trip and go straight to the
// instant local browser voice — critical for fast back-to-back responses.
let elevenLabsAvailable: boolean | null = null;
function preloadVoices() {
  if (typeof window === 'undefined') return;
  if (voicesPreloadStarted) return;
  voicesPreloadStarted = true;
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    synth.getVoices();
    synth.addEventListener?.('voiceschanged', () => {
      synth.getVoices();
    });
  } catch {
    /* noop */
  }
}

// ---------- Mic permission ----------

/** Pre-warm mic permission with explicit echo/noise constraints. */
async function ensureMicPermission(): Promise<void> {
  if (typeof navigator === 'undefined') return;
  if (!navigator.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    // Immediately release; SpeechRecognition opens its own stream after.
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    /* user will see the SpeechRecognition not-allowed error if denied */
  }
}

// ---------- Hook ----------

export function useSpeech({
  onTranscript,
  lang = 'en-US',
  silenceTimeoutMs = 2000,
  rate = 1,
  mode = 'manual',
  transport = 'browser',
  onAudioChunk,
  allowBargeIn = false,
}: UseSpeechOptions) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');
  const allowBargeInRef = useRef(allowBargeIn);
  useEffect(() => { allowBargeInRef.current = allowBargeIn; }, [allowBargeIn]);

  // STT refs
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const modeRef = useRef<SpeechMode>(mode);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferedTextRef = useRef<string>('');
  /** When true, the mic should auto-restart if it ends unexpectedly. */
  const keepAliveRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startListeningRef = useRef<() => void>(() => {});

  // Deepgram transport refs
  const transportRef = useRef(transport);
  const onAudioChunkRef = useRef(onAudioChunk);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { transportRef.current = transport; }, [transport]);
  useEffect(() => { onAudioChunkRef.current = onAudioChunk; }, [onAudioChunk]);

  // TTS refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rateRef = useRef(clampRate(rate));
  const lastSpokenTextRef = useRef<string>('');
  const speakingRef = useRef(false);
  const stopSpeakingRef = useRef<() => void>(() => {});

  // Pre-load voices once on first mount of the hook anywhere in the app.
  useEffect(() => { preloadVoices(); }, []);

  // Keep callback/mode refs fresh
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // ---------- STT ----------

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const flushBuffer = useCallback(() => {
    const text = bufferedTextRef.current.trim();
    bufferedTextRef.current = '';
    if (text) {
      console.log('[STT] Flushing turn:', text);
      onTranscriptRef.current(text);
    }
  }, []);

  const stopListening = useCallback((opts: StopOptions = {}) => {
    const { flush = true } = opts;
    clearSilenceTimer();
    keepAliveRef.current = false;

    // Deepgram transport: tear down MediaRecorder + mic stream.
    if (transportRef.current === 'deepgram') {
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch {}
        mediaRecorderRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setListening(false);
      setInterim('');
      return;
    }

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (modeRef.current === 'continuous') {
      if (flush) flushBuffer();
      else bufferedTextRef.current = '';
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onresult = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setListening(false);
    setInterim('');
  }, [clearSilenceTimer, flushBuffer]);

  const armSilenceTimer = useCallback(() => {
    if (!silenceTimeoutMs) return;
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // In continuous mode, silence only ends the TURN if the prospect has
      // actually said something. With an empty buffer (e.g. they haven't
      // spoken yet after Start), keep listening instead of killing the mic —
      // otherwise the loop gets stuck on "Processing…" forever.
      if (modeRef.current === 'continuous' && !bufferedTextRef.current.trim()) {
        console.log('[STT] Silence with empty buffer — staying live');
        armSilenceTimer();
        return;
      }
      console.log('[STT] Silence detected — auto-stopping mic');
      stopListening({ flush: true });
    }, silenceTimeoutMs);
  }, [silenceTimeoutMs, clearSilenceTimer, stopListening]);

  const startListening = useCallback(async () => {
    // Deepgram transport: capture mic with MediaRecorder, stream to server.
    if (transportRef.current === 'deepgram') {
      if (speakingRef.current) {
        console.log('[STT] startListening (deepgram) while AI speaking — deferring');
        return;
      }
      if (mediaRecorderRef.current) return; // already capturing
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        mediaStreamRef.current = stream;
        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mr.ondataavailable = async (e) => {
          if (e.data.size > 0) onAudioChunkRef.current?.(await e.data.arrayBuffer());
        };
        mr.start(250); // emit a chunk every 250ms for low-latency streaming
        mediaRecorderRef.current = mr;
        setListening(true);
        console.log('[STT] Deepgram capture started');
      } catch (err) {
        console.error('[STT] Deepgram getUserMedia failed:', err);
        alert('Microphone access denied. Please allow microphone permission and try again.');
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported. Please use Google Chrome.');
      return;
    }

    // Don't open mic while AI is speaking — would echo into STT.
    // Exception: barge-in mode keeps the mic live so the prospect can interrupt.
    if (speakingRef.current && !allowBargeInRef.current) {
      console.log('[STT] startListening called while AI is speaking — deferring');
      return;
    }

    // Warm mic permission with echo-cancellation hints; safe if already granted.
    await ensureMicPermission();

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch {}
    }

    keepAliveRef.current = true;
    bufferedTextRef.current = '';

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[STT] Listening started, lang:', recognition.lang);
      setListening(true);
      armSilenceTimer();
    };

    recognition.onspeechstart = () => { clearSilenceTimer(); };
    recognition.onspeechend = () => { armSilenceTimer(); };

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }

      if (interimText || finalText) clearSilenceTimer();
      if (interimText) setInterim(interimText);

      // Barge-in: if the AI is speaking and the prospect says something that
      // isn't just the AI's own voice echoing back, cancel the AI immediately.
      if (allowBargeInRef.current && speakingRef.current) {
        const heard = (finalText || interimText).trim();
        if (heard.length >= 4 && !isLikelyEcho(heard, lastSpokenTextRef.current)) {
          console.log('[STT] Barge-in detected — cancelling AI speech');
          stopSpeakingRef.current();
        }
      }

      if (finalText.trim()) {
        const trimmed = finalText.trim();
        setInterim('');
        if (modeRef.current === 'continuous') {
          bufferedTextRef.current = bufferedTextRef.current
            ? bufferedTextRef.current + ' ' + trimmed
            : trimmed;
          console.log('[STT] Final (buffered):', trimmed);
        } else {
          console.log('[STT] Final:', trimmed);
          onTranscriptRef.current(trimmed);
        }
        armSilenceTimer();
      }
    };

    recognition.onerror = (e: any) => {
      console.error('[STT] Error:', e.error);
      switch (e.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          alert('Microphone access denied. Please allow microphone permission and try again.');
          stopListening({ flush: false });
          break;
        case 'audio-capture':
          alert('No microphone detected. Please connect a mic and try again.');
          stopListening({ flush: false });
          break;
        case 'no-speech':
          // Chrome fires this after ~5s of silence. Auto-restart if keepAlive.
          if (keepAliveRef.current && !speakingRef.current) {
            console.log('[STT] no-speech — restarting mic');
            // Recognition will fire onend next, which handles restart.
          } else {
            stopListening({ flush: true });
          }
          break;
        case 'aborted':
          // Aborted by us or browser — let onend handle restart.
          break;
        case 'network':
          stopListening({ flush: true });
          break;
        default:
          stopListening({ flush: true });
      }
    };

    recognition.onend = () => {
      console.log('[STT] Ended');
      recognitionRef.current = null;
      setListening(false);

      // Auto-restart if keepAlive is set and AI isn't speaking
      if (keepAliveRef.current && !speakingRef.current) {
        console.log('[STT] Auto-restarting mic (keepAlive)');
        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null;
          if (keepAliveRef.current && !speakingRef.current) {
            startListeningRef.current();
          }
        }, 100);
      } else {
        // Intentional stop or AI is speaking — flush buffer
        if (modeRef.current === 'continuous') {
          flushBuffer();
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('[STT] start() threw, likely already running:', err);
    }
  }, [lang, armSilenceTimer, clearSilenceTimer, stopListening]);

  // Keep ref in sync so onend restart always uses latest startListening.
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ---------- Cleanup ----------

  useEffect(() => {
    return () => {
      keepAliveRef.current = false;
      clearSilenceTimer();
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      try { window.speechSynthesis?.cancel(); } catch {}
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
        audioRef.current = null;
      }
    };
  }, [clearSilenceTimer]);

  // ---------- TTS: ElevenLabs (primary) ----------

  const speakWithElevenLabs = useCallback(async (
    text: string,
  ): Promise<boolean> => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      // Bound the probe so a cold/slow API can never stall the voice loop.
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        elevenLabsAvailable = false;
        console.warn('[TTS] ElevenLabs unavailable, falling back to browser TTS');
        return false;
      }
      elevenLabsAvailable = true;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
        audioRef.current.src = '';
      }

      const audio = new Audio(url);
      // preservesPitch keeps voice natural at 1.5x/2x — without this,
      // accelerated audio sounds chipmunky.
      // Both modern (preservesPitch) and webkit-prefixed names are set
      // for cross-browser support.
      (audio as any).preservesPitch = true;
      (audio as any).webkitPreservesPitch = true;
      audio.playbackRate = rateRef.current;
      audioRef.current = audio;

      return await new Promise<boolean>((resolve) => {
        audio.onplay = () => {
          speakingRef.current = true;
          setSpeaking(true);
        };
        audio.onended = () => {
          speakingRef.current = false;
          setSpeaking(false);
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
          resolve(true);
        };
        audio.onerror = () => {
          speakingRef.current = false;
          setSpeaking(false);
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
          resolve(false);
        };
        audio.play().catch(() => {
          speakingRef.current = false;
          setSpeaking(false);
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
          resolve(false);
        });
      });
    } catch (err) {
      elevenLabsAvailable = false;
      console.warn('[TTS] ElevenLabs error, falling back to browser TTS:', err);
      return false;
    }
  }, []);

  // ---------- TTS: browser SpeechSynthesis (fallback) ----------

  const speakWithBrowser = useCallback(async (text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    let voices = synth.getVoices();
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        synth.onvoiceschanged = () => resolve();
        setTimeout(resolve, 500);
      });
      voices = synth.getVoices();
    }

    const preferred = voices.find((v) =>
      v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Natural'),
    ) || voices.find((v) => v.lang.startsWith('en'));

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rateRef.current;
    utterance.pitch = 1.0;
    utterance.lang = lang;
    if (preferred) {
      utterance.voice = preferred;
      console.log('[TTS] Voice:', preferred.name, preferred.lang);
    }

    utterance.onstart = () => { speakingRef.current = true; setSpeaking(true); };
    utterance.onend = () => { speakingRef.current = false; setSpeaking(false); };
    utterance.onerror = () => { speakingRef.current = false; setSpeaking(false); };

    synth.speak(utterance);
  }, [lang]);

  // ---------- Public TTS API ----------

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;

    lastSpokenTextRef.current = text;
    console.log('[TTS] Speaking:', text.slice(0, 80));

    try { window.speechSynthesis?.cancel(); } catch {}
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current = null;
    }

    // Skip the network round-trip entirely once we know the server has no TTS.
    if (elevenLabsAvailable !== false) {
      const success = await speakWithElevenLabs(text);
      if (success) return;
    }

    console.log('[TTS] Using browser fallback');
    await speakWithBrowser(text);
  }, [speakWithElevenLabs, speakWithBrowser]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current.src = '';
      audioRef.current = null;
    }
    try { window.speechSynthesis?.cancel(); } catch {}
    speakingRef.current = false;
    lastSpokenTextRef.current = '';
    setSpeaking(false);
  }, []);

  // Keep ref fresh so the STT onresult handler can trigger barge-in.
  useEffect(() => { stopSpeakingRef.current = stopSpeaking; }, [stopSpeaking]);

  /** Click-to-interrupt barge-in: stop AI immediately. Caller can then start mic. */
  const interruptSpeech = useCallback(() => {
    stopSpeaking();
  }, [stopSpeaking]);

  // ---------- Live rate updates ----------
  useEffect(() => {
    const next = clampRate(rate);
    const prev = rateRef.current;
    rateRef.current = next;
    if (next === prev) return;

    if (audioRef.current && !audioRef.current.paused) {
      console.log(`[TTS] Rate changed ${prev}x → ${next}x — applying live to ElevenLabs audio (preservesPitch)`);
      (audioRef.current as any).preservesPitch = true;
      (audioRef.current as any).webkitPreservesPitch = true;
      audioRef.current.playbackRate = next;
      return;
    }

    if (speakingRef.current && lastSpokenTextRef.current && window.speechSynthesis) {
      console.log(`[TTS] Rate changed ${prev}x → ${next}x — restarting browser utterance`);
      const text = lastSpokenTextRef.current;
      try { window.speechSynthesis.cancel(); } catch {}
      void speakWithBrowser(text);
    }
  }, [rate, speakWithBrowser]);

  return {
    listening,
    speaking,
    interim,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    interruptSpeech,
  };
}
