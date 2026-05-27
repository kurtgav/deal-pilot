import { useRef, useState, useCallback, useEffect } from 'react';

interface UseSpeechOptions {
  onTranscript: (text: string) => void;
  lang?: string;
  /**
   * Milliseconds of silence after which the mic auto-stops.
   * Defaults to 2000ms (2 seconds). Set to 0 to disable auto-stop.
   */
  silenceTimeoutMs?: number;
}

export function useSpeech({ onTranscript, lang = 'en-US', silenceTimeoutMs = 2000 }: UseSpeechOptions) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpokenRef = useRef(false);

  // Keep callback ref fresh
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      // Detach handlers so onend can't trigger a restart
      recognitionRef.current.onend = null;
      recognitionRef.current.onresult = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    hasSpokenRef.current = false;
    setListening(false);
    setInterim('');
  }, [clearSilenceTimer]);

  // Reset (or arm) the silence timer. Called on every speech event.
  const armSilenceTimer = useCallback(() => {
    if (!silenceTimeoutMs) return;
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      console.log('[STT] Silence detected — auto-stopping mic');
      stopListening();
    }, silenceTimeoutMs);
  }, [silenceTimeoutMs, clearSilenceTimer, stopListening]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported. Please use Google Chrome.');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[STT] Listening started');
      hasSpokenRef.current = false;
      setListening(true);
      // Arm silence timer immediately — if they never start talking, mic still auto-closes
      armSilenceTimer();
    };

    recognition.onspeechstart = () => {
      hasSpokenRef.current = true;
      clearSilenceTimer();
    };

    recognition.onspeechend = () => {
      // Browser detected end of speech — start the silence countdown
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

      // Any speech activity → user is talking, cancel pending auto-stop
      if (interimText || finalText) {
        hasSpokenRef.current = true;
        clearSilenceTimer();
      }

      if (interimText) {
        setInterim(interimText);
      }

      if (finalText.trim()) {
        setInterim('');
        console.log('[STT] Final:', finalText.trim());
        onTranscriptRef.current(finalText.trim());
        // After a final result, re-arm the silence timer.
        // If they keep talking, onresult will fire again and clear it.
        armSilenceTimer();
      }
    };

    recognition.onerror = (e: any) => {
      console.error('[STT] Error:', e.error);
      if (e.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permission and try again.');
        stopListening();
      } else if (e.error === 'no-speech') {
        // Browser's own no-speech timeout — treat as stop
        stopListening();
      }
    };

    recognition.onend = () => {
      // Browser ended recognition (often after silence). Don't restart —
      // we want the mic to actually turn off when the client stops talking.
      console.log('[STT] Ended');
      stopListening();
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
    };
  }, [clearSilenceTimer]);

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = lang;

    const voices = synth.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Natural')
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    synth.speak(utterance);
  }, [lang]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { listening, speaking, interim, startListening, stopListening, speak, stopSpeaking };
}
