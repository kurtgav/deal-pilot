import { useRef, useState, useCallback, useEffect } from 'react';

interface UseSpeechOptions {
  onTranscript: (text: string) => void;
  lang?: string;
}

export function useSpeech({ onTranscript, lang = 'en-US' }: UseSpeechOptions) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);

  // Keep callback ref fresh
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported. Please use Google Chrome.');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[STT] Listening started');
      setListening(true);
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

      if (interimText) {
        setInterim(interimText);
      }

      if (finalText.trim()) {
        setInterim('');
        console.log('[STT] Final:', finalText.trim());
        onTranscriptRef.current(finalText.trim());
      }
    };

    recognition.onerror = (e: any) => {
      console.error('[STT] Error:', e.error);
      if (e.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permission and try again.');
        setListening(false);
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      console.log('[STT] Ended, restarting...');
      // Auto-restart to keep listening
      if (recognitionRef.current) {
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch {}
        }, 100);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
    setInterim('');
  }, []);

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
