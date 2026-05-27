import { useRef, useState, useCallback, useEffect } from 'react';

export type SpeechMode = 'manual' | 'continuous';

interface UseSpeechOptions {
  onTranscript: (text: string) => void;
  lang?: string;
  /**
   * Milliseconds of silence after which the mic auto-stops.
   * Defaults to 2000ms. Set to 0 to disable auto-stop.
   */
  silenceTimeoutMs?: number;
  /**
   * Speech synthesis playback rate (0.1–10). Default 1.
   * If changed while AI is speaking, the current utterance is cancelled
   * and re-spoken from the start at the new rate.
   */
  rate?: number;
  /**
   * Transcript dispatch mode.
   * - 'manual'      → onTranscript fires on every FINAL recognition result (legacy).
   * - 'continuous'  → finals are buffered into a single turn; onTranscript fires
   *                   ONCE when the mic stops (silence or manual). This is
   *                   required for closed-loop conversational mode where each
   *                   stop = one user turn = one AI response.
   */
  mode?: SpeechMode;
}

interface StopOptions {
  /** When true (default) any buffered text in continuous mode is flushed via onTranscript. */
  flush?: boolean;
}

const MIN_RATE = 0.5;
const MAX_RATE = 3;

function clampRate(r: number): number {
  if (Number.isNaN(r)) return 1;
  return Math.min(MAX_RATE, Math.max(MIN_RATE, r));
}

export function useSpeech({
  onTranscript,
  lang = 'en-US',
  silenceTimeoutMs = 2000,
  rate = 1,
  mode = 'manual',
}: UseSpeechOptions) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');

  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const modeRef = useRef<SpeechMode>(mode);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferedTextRef = useRef<string>('');

  // Speech synthesis state
  const rateRef = useRef(clampRate(rate));
  const lastSpokenTextRef = useRef<string>('');
  const speakingRef = useRef(false);

  // Keep callback/mode refs fresh
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

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
      console.log('[STT] Silence detected — auto-stopping mic');
      stopListening({ flush: true });
    }, silenceTimeoutMs);
  }, [silenceTimeoutMs, clearSilenceTimer, stopListening]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported. Please use Google Chrome.');
      return;
    }

    // Defensive: if AI is currently speaking, don't open mic (would echo).
    if (speakingRef.current) {
      console.log('[STT] startListening called while AI is speaking — deferring');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch {}
    }

    bufferedTextRef.current = '';

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[STT] Listening started');
      setListening(true);
      armSilenceTimer();
    };

    recognition.onspeechstart = () => {
      clearSilenceTimer();
    };

    recognition.onspeechend = () => {
      armSilenceTimer();
    };

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (interimText || finalText) {
        clearSilenceTimer();
      }

      if (interimText) {
        setInterim(interimText);
      }

      if (finalText.trim()) {
        const trimmed = finalText.trim();
        setInterim('');
        if (modeRef.current === 'continuous') {
          // Buffer this final into the current turn — flush happens on silence/stop.
          bufferedTextRef.current = (bufferedTextRef.current
            ? bufferedTextRef.current + ' ' + trimmed
            : trimmed);
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
      if (e.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permission and try again.');
        stopListening({ flush: false });
      } else if (e.error === 'no-speech' || e.error === 'aborted') {
        stopListening({ flush: true });
      }
    };

    recognition.onend = () => {
      console.log('[STT] Ended');
      stopListening({ flush: true });
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [lang, armSilenceTimer, clearSilenceTimer, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, [clearSilenceTimer]);

  // Internal speaker — uses the latest rate from rateRef
  const speakInternal = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;

    synth.cancel();
    lastSpokenTextRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rateRef.current;
    utterance.pitch = 1.0;
    utterance.lang = lang;

    const voices = synth.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Natural')
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      speakingRef.current = true;
      setSpeaking(true);
    };
    utterance.onend = () => {
      speakingRef.current = false;
      setSpeaking(false);
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      setSpeaking(false);
    };

    synth.speak(utterance);
  }, [lang]);

  const speak = useCallback((text: string) => {
    speakInternal(text);
  }, [speakInternal]);

  const stopSpeaking = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch {}
    speakingRef.current = false;
    lastSpokenTextRef.current = '';
    setSpeaking(false);
  }, []);

  // Live rate updates: restart current utterance at new rate
  useEffect(() => {
    const next = clampRate(rate);
    const prev = rateRef.current;
    rateRef.current = next;
    if (next !== prev && speakingRef.current && lastSpokenTextRef.current) {
      console.log(`[TTS] Rate changed ${prev}x → ${next}x — restarting utterance`);
      speakInternal(lastSpokenTextRef.current);
    }
  }, [rate, speakInternal]);

  return {
    listening,
    speaking,
    interim,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
