import { useRef, useState, useCallback, useEffect } from 'react';

export type SpeechMode = 'manual' | 'continuous';

interface UseSpeechOptions {
  onTranscript: (text: string) => void;
  /**
   * Recognition language. Use 'fil-PH' for Filipino/Tagalog (also recognizes
   * English/Taglish code-switching) or 'en-US' for English-only.
   */
  lang?: string;
  /**
   * Milliseconds of silence after which the mic auto-stops.
   * Defaults to 2000ms. Set to 0 to disable auto-stop.
   */
  silenceTimeoutMs?: number;
  /**
   * Speech synthesis playback rate (0.5–3). Default 1.
   * For ElevenLabs audio playback this updates live via `playbackRate`.
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

// ---------- Filipino language helpers (TTS) ----------

/** Detect Filipino/Tagalog text by looking for common Filipino words. */
function detectFilipino(text: string): boolean {
  const filipinoIndicators = /\b(ako|ikaw|kayo|kami|tayo|sila|niya|natin|namin|ninyo|nila|ang|ng|sa|mga|hindi|oo|opo|po|kasi|kaya|naman|talaga|paano|bakit|saan|kailan|sino|ano|alin|ilan|magkano|salamat|maganda|magandang|umaga|tanghali|hapon|gabi|gusto|ayaw|pwede|puwede|sige|meron|mayroon|wala|nasaan|tulungan|gawin|ginagawa|gagawin|yung|tapos|kelan|tungkol|kahit|para|pero|kung|noong|ngayon|bukas|kahapon|mahal|mura|presyo|tao|trabaho|kumusta|paalam)\b/i;
  return filipinoIndicators.test(text);
}

/**
 * Phonetic preprocessor for Filipino text when no native Filipino TTS voice is
 * available. Maps short particles/words to phonetic spellings that an English
 * TTS engine will pronounce closer to Filipino.
 */
function preprocessFilipinoForTTS(text: string): string {
  const phoneticMap: [RegExp, string][] = [
    [/\bna\b/gi, 'nah'], [/\bsa\b/gi, 'sah'], [/\bng\b/gi, 'nang'],
    [/\bmga\b/gi, 'manga'], [/\bpo\b/gi, 'poh'], [/\bko\b/gi, 'koh'],
    [/\bmo\b/gi, 'moh'], [/\bka\b/gi, 'kah'], [/\bba\b/gi, 'bah'],
    [/\bpa\b/gi, 'pah'], [/\bni\b/gi, 'nee'], [/\bsi\b/gi, 'see'],
    [/\bat\b/gi, 'aht'], [/\boo\b/gi, 'oh-oh'],
    [/\bako\b/gi, 'ah-koh'], [/\bito\b/gi, 'ee-toh'], [/\byan\b/gi, 'yahn'],
    [/\byung\b/gi, 'yoong'], [/\bkasi\b/gi, 'kah-see'], [/\bkami\b/gi, 'kah-mee'],
    [/\bkayo\b/gi, 'kah-yoh'], [/\btayo\b/gi, 'tah-yoh'], [/\bsila\b/gi, 'see-lah'],
    [/\bnamin\b/gi, 'nah-meen'], [/\bnatin\b/gi, 'nah-teen'], [/\bninyo\b/gi, 'neen-yoh'],
    [/\bnila\b/gi, 'nee-lah'], [/\bpara\b/gi, 'pah-rah'], [/\bpero\b/gi, 'peh-roh'],
    [/\btalaga\b/gi, 'tah-lah-gah'], [/\bnaman\b/gi, 'nah-mahn'], [/\bsige\b/gi, 'see-geh'],
    [/\bano\b/gi, 'ah-noh'], [/\bpaano\b/gi, 'pah-ah-noh'], [/\bbakit\b/gi, 'bah-kit'],
    [/\bsaan\b/gi, 'sah-ahn'], [/\bkailan\b/gi, 'kah-ee-lahn'], [/\bsino\b/gi, 'see-noh'],
    [/\bgusto\b/gi, 'goos-toh'], [/\bmeron\b/gi, 'meh-rohn'], [/\bwala\b/gi, 'wah-lah'],
    [/\bmaganda\b/gi, 'mah-gahn-dah'], [/\bmagandang\b/gi, 'mah-gahn-dahng'],
    [/\bsalamat\b/gi, 'sah-lah-maht'], [/\bkumusta\b/gi, 'koo-moos-tah'],
    [/\bmahal\b/gi, 'mah-hahl'], [/\bngayon\b/gi, 'ngah-yohn'], [/\btapos\b/gi, 'tah-pohs'],
    [/\bhindu\b/gi, 'heen-dee'], [/\bhindi\b/gi, 'heen-dee'],
    [/\btulong\b/gi, 'too-lohng'], [/\btulungan\b/gi, 'too-loo-ngahn'],
    [/\bmaitutulong\b/gi, 'mah-ee-too-too-lohng'],
    [/\binyo\b/gi, 'een-yoh'], [/\baraw\b/gi, 'ah-rahw'],
  ];
  let processed = text;
  for (const [pattern, replacement] of phoneticMap) {
    processed = processed.replace(pattern, replacement);
  }
  return processed;
}

// ---------- Hook ----------

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

  // STT refs
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const modeRef = useRef<SpeechMode>(mode);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferedTextRef = useRef<string>('');

  // TTS refs
  const audioRef = useRef<HTMLAudioElement | null>(null);  // ElevenLabs
  const rateRef = useRef(clampRate(rate));
  const lastSpokenTextRef = useRef<string>('');
  const lastLanguageRef = useRef<'en' | 'fil'>('en');
  const speakingRef = useRef(false);

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

    // Don't open mic while AI is speaking — would echo into STT.
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
    // 'fil-PH' allows Filipino + English (Taglish/code-switching).
    recognition.lang = (lang === 'fil-PH' || lang === 'tl-PH') ? 'fil-PH' : lang;
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

  // ---------- Cleanup ----------

  useEffect(() => {
    return () => {
      clearSilenceTimer();
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
    language: 'en' | 'fil',
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      if (!res.ok) {
        console.warn('[TTS] ElevenLabs unavailable, falling back to browser TTS');
        return false;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Stop any currently playing audio
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
        audioRef.current.src = '';
      }

      const audio = new Audio(url);
      audio.playbackRate = rateRef.current;   // apply current rate
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
      console.warn('[TTS] ElevenLabs error, falling back to browser TTS:', err);
      return false;
    }
  }, []);

  // ---------- TTS: browser SpeechSynthesis (fallback) ----------

  const speakWithBrowser = useCallback(async (text: string, isFilipino: boolean) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Ensure voices loaded (Chrome loads them asynchronously)
    let voices = synth.getVoices();
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        synth.onvoiceschanged = () => resolve();
        setTimeout(resolve, 500);
      });
      voices = synth.getVoices();
    }

    let preferred: SpeechSynthesisVoice | undefined;
    let usePhoneticFix = false;

    if (isFilipino) {
      preferred = voices.find(v =>
        v.name.toLowerCase().includes('google') &&
        (v.lang === 'fil-PH' || v.lang === 'tl-PH' || v.name.toLowerCase().includes('filipino'))
      );
      if (!preferred) {
        preferred = voices.find(v =>
          v.lang === 'fil-PH' || v.lang === 'tl-PH' ||
          v.name.toLowerCase().includes('filipino') ||
          v.name.toLowerCase().includes('tagalog')
        );
      }
      if (!preferred) {
        preferred = voices.find(v => v.lang.startsWith('fil') || v.lang.startsWith('tl'));
      }
      if (!preferred) {
        usePhoneticFix = true;
        preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
          || voices.find(v => v.lang.startsWith('en'));
        console.warn('[TTS] No Filipino voice available — using phonetic fallback.');
      }
    } else {
      preferred = voices.find(v =>
        v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Natural')
      ) || voices.find(v => v.lang.startsWith('en'));
    }

    const finalText = usePhoneticFix ? preprocessFilipinoForTTS(text) : text;

    const utterance = new SpeechSynthesisUtterance(finalText);
    utterance.rate = rateRef.current;
    utterance.pitch = isFilipino ? 1.1 : 1.0;
    utterance.lang = usePhoneticFix ? 'en-US' : (isFilipino ? 'fil-PH' : lang);
    if (preferred) {
      utterance.voice = preferred;
      console.log('[TTS] Voice:', preferred.name, preferred.lang, usePhoneticFix ? '(phonetic)' : '(native)');
    }

    utterance.onstart = () => { speakingRef.current = true; setSpeaking(true); };
    utterance.onend = () => { speakingRef.current = false; setSpeaking(false); };
    utterance.onerror = () => { speakingRef.current = false; setSpeaking(false); };

    synth.speak(utterance);
  }, [lang]);

  // ---------- Public TTS API ----------

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;

    const isFilipino = detectFilipino(text);
    const language: 'en' | 'fil' = isFilipino ? 'fil' : 'en';
    lastSpokenTextRef.current = text;
    lastLanguageRef.current = language;

    console.log(`[TTS] Speaking (${language}):`, text.slice(0, 80));

    // Stop any in-flight TTS first
    try { window.speechSynthesis?.cancel(); } catch {}
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current = null;
    }

    // Try ElevenLabs first; fallback to browser TTS on failure.
    const success = await speakWithElevenLabs(text, language);
    if (success) return;

    console.log('[TTS] Using browser fallback');
    await speakWithBrowser(text, isFilipino);
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

  // ---------- Live rate updates ----------
  // ElevenLabs path: HTMLAudioElement.playbackRate is live — no restart needed.
  // SpeechSynthesis path: cancel and re-speak the current utterance at new rate.
  useEffect(() => {
    const next = clampRate(rate);
    const prev = rateRef.current;
    rateRef.current = next;
    if (next === prev) return;

    if (audioRef.current && !audioRef.current.paused) {
      console.log(`[TTS] Rate changed ${prev}x → ${next}x — applying live to ElevenLabs audio`);
      audioRef.current.playbackRate = next;
      return;
    }

    if (speakingRef.current && lastSpokenTextRef.current && window.speechSynthesis) {
      console.log(`[TTS] Rate changed ${prev}x → ${next}x — restarting browser utterance`);
      const text = lastSpokenTextRef.current;
      const isFilipino = lastLanguageRef.current === 'fil';
      try { window.speechSynthesis.cancel(); } catch {}
      // Fire & forget — speakWithBrowser is async but we don't need to await.
      void speakWithBrowser(text, isFilipino);
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
  };
}
