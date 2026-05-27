import { useRef, useState, useCallback, useEffect } from 'react';

interface UseSpeechOptions {
  onTranscript: (text: string) => void;
  lang?: string;
}

/**
 * Detect Filipino/Tagalog text by looking for common Filipino words.
 */
function detectFilipino(text: string): boolean {
  const filipinoIndicators = /\b(ako|ikaw|kayo|kami|tayo|sila|niya|natin|namin|ninyo|nila|ang|ng|sa|mga|hindi|oo|opo|po|kasi|kaya|naman|talaga|paano|bakit|saan|kailan|sino|ano|alin|ilan|magkano|salamat|maganda|magandang|umaga|tanghali|hapon|gabi|gusto|ayaw|pwede|puwede|sige|meron|mayroon|wala|nasaan|tulungan|gawin|ginagawa|gagawin|yung|tapos|kelan|tungkol|kahit|para|pero|kung|noong|ngayon|bukas|kahapon|mahal|mura|presyo|tao|trabaho|kumusta|paalam)\b/i;
  return filipinoIndicators.test(text);
}

/**
 * Preprocess Filipino text for browser TTS engines that lack native Filipino support.
 * Converts short Filipino particles/words into phonetic spellings that English TTS
 * will pronounce correctly with a Filipino sound.
 *
 * Problem: English TTS reads "na" as "EN-AY", "sa" as "ES-AY", "ng" as "EN-JEE"
 * Solution: Replace with phonetic equivalents that English TTS pronounces like Filipino
 */
function preprocessFilipinoForTTS(text: string): string {
  // Only apply phonetic replacements if no Filipino voice is available
  // These map Filipino particles to phonetic spellings an English TTS will say correctly
  const phoneticMap: [RegExp, string][] = [
    // Particles that English TTS butchers (reads as letters)
    [/\bna\b/gi, 'nah'],
    [/\bsa\b/gi, 'sah'],
    [/\bng\b/gi, 'nang'],
    [/\bmga\b/gi, 'manga'],
    [/\bpo\b/gi, 'poh'],
    [/\bko\b/gi, 'koh'],
    [/\bmo\b/gi, 'moh'],
    [/\bka\b/gi, 'kah'],
    [/\bba\b/gi, 'bah'],
    [/\bpa\b/gi, 'pah'],
    [/\bni\b/gi, 'nee'],
    [/\bsi\b/gi, 'see'],
    [/\bat\b/gi, 'aht'],
    [/\boo\b/gi, 'oh-oh'],
    // Common words that get mispronounced
    [/\bako\b/gi, 'ah-koh'],
    [/\bito\b/gi, 'ee-toh'],
    [/\byan\b/gi, 'yahn'],
    [/\byung\b/gi, 'yoong'],
    [/\bkasi\b/gi, 'kah-see'],
    [/\bkami\b/gi, 'kah-mee'],
    [/\bkayo\b/gi, 'kah-yoh'],
    [/\btayo\b/gi, 'tah-yoh'],
    [/\bsila\b/gi, 'see-lah'],
    [/\bnamin\b/gi, 'nah-meen'],
    [/\bnatin\b/gi, 'nah-teen'],
    [/\bninyo\b/gi, 'neen-yoh'],
    [/\bnila\b/gi, 'nee-lah'],
    [/\bpara\b/gi, 'pah-rah'],
    [/\bpero\b/gi, 'peh-roh'],
    [/\btalaga\b/gi, 'tah-lah-gah'],
    [/\bnaman\b/gi, 'nah-mahn'],
    [/\bsige\b/gi, 'see-geh'],
    [/\bano\b/gi, 'ah-noh'],
    [/\bpaano\b/gi, 'pah-ah-noh'],
    [/\bbakit\b/gi, 'bah-kit'],
    [/\bsaan\b/gi, 'sah-ahn'],
    [/\bkailan\b/gi, 'kah-ee-lahn'],
    [/\bsino\b/gi, 'see-noh'],
    [/\bgusto\b/gi, 'goos-toh'],
    [/\bmeron\b/gi, 'meh-rohn'],
    [/\bwala\b/gi, 'wah-lah'],
    [/\bmaganda\b/gi, 'mah-gahn-dah'],
    [/\bmagandang\b/gi, 'mah-gahn-dahng'],
    [/\bsalamat\b/gi, 'sah-lah-maht'],
    [/\bkumusta\b/gi, 'koo-moos-tah'],
    [/\bmahal\b/gi, 'mah-hahl'],
    [/\bngayon\b/gi, 'ngah-yohn'],
    [/\btapos\b/gi, 'tah-pohs'],
    [/\bhindu\b/gi, 'heen-dee'],
    [/\bhindi\b/gi, 'heen-dee'],
    [/\btulong\b/gi, 'too-lohng'],
    [/\btulungan\b/gi, 'too-loo-ngahn'],
    [/\bmaitutulong\b/gi, 'mah-ee-too-too-lohng'],
    [/\binyo\b/gi, 'een-yoh'],
    [/\baraw\b/gi, 'ah-rahw'],
  ];

  let processed = text;
  for (const [pattern, replacement] of phoneticMap) {
    processed = processed.replace(pattern, replacement);
  }
  return processed;
}

/**
 * Speak text using ElevenLabs (high quality, multilingual, smooth Filipino).
 * Returns a Promise that resolves when speech completes or rejects on failure.
 */
async function speakWithElevenLabs(
  text: string,
  language: 'en' | 'fil',
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  onStart: () => void,
  onEnd: () => void
): Promise<boolean> {
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
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    return new Promise<boolean>((resolve) => {
      audio.onplay = () => onStart();
      audio.onended = () => {
        onEnd();
        URL.revokeObjectURL(url);
        resolve(true);
      };
      audio.onerror = () => {
        onEnd();
        URL.revokeObjectURL(url);
        resolve(false);
      };
      audio.play().catch(() => {
        onEnd();
        URL.revokeObjectURL(url);
        resolve(false);
      });
    });
  } catch (err) {
    console.warn('[TTS] ElevenLabs error, falling back to browser TTS:', err);
    return false;
  }
}

export function useSpeech({ onTranscript, lang = 'en-US' }: UseSpeechOptions) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep callback ref fresh
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported. Please use Google Chrome.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    // 'fil-PH' allows recognition of both Filipino and English (Taglish/code-switching)
    recognition.lang = lang === 'fil-PH' || lang === 'tl-PH' ? 'fil-PH' : lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[STT] Listening started, lang:', recognition.lang);
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

  /**
   * Speak text using ElevenLabs (high quality multilingual TTS).
   * Falls back to browser SpeechSynthesis if ElevenLabs is unavailable.
   */
  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;

    const isFilipino = detectFilipino(text);
    const language: 'en' | 'fil' = isFilipino ? 'fil' : 'en';

    console.log(`[TTS] Speaking (${language}):`, text.slice(0, 80));

    // Stop any current speech (browser or ElevenLabs)
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Try ElevenLabs first (best quality + Filipino support)
    const success = await speakWithElevenLabs(
      text,
      language,
      audioRef,
      () => setSpeaking(true),
      () => setSpeaking(false)
    );

    if (success) return;

    // Fallback: browser SpeechSynthesis
    console.log('[TTS] Using browser fallback');
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Ensure voices are loaded (Chrome loads them async)
    let voices = synth.getVoices();
    if (voices.length === 0) {
      await new Promise<void>(resolve => {
        synth.onvoiceschanged = () => resolve();
        setTimeout(resolve, 500);
      });
      voices = synth.getVoices();
    }

    let preferred: SpeechSynthesisVoice | undefined;
    let usePhoneticFix = false;

    if (isFilipino) {
      // Priority 1: Google Filipino voice (available in Chrome - native Filipino accent)
      preferred = voices.find(v =>
        v.name.toLowerCase().includes('google') &&
        (v.lang === 'fil-PH' || v.lang === 'tl-PH' || v.name.toLowerCase().includes('filipino'))
      );
      // Priority 2: Any Filipino voice
      if (!preferred) {
        preferred = voices.find(v =>
          v.lang === 'fil-PH' || v.lang === 'tl-PH' ||
          v.name.toLowerCase().includes('filipino') ||
          v.name.toLowerCase().includes('tagalog')
        );
      }
      // Priority 3: Microsoft Filipino voice (if language pack installed)
      if (!preferred) {
        preferred = voices.find(v => v.lang.startsWith('fil') || v.lang.startsWith('tl'));
      }
      // Last resort: English voice with phonetic preprocessing
      if (!preferred) {
        usePhoneticFix = true;
        preferred = voices.find(v =>
          v.name.includes('Google') && v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en'));
        console.warn('[TTS] No Filipino voice available. Install Filipino language or use Chrome for Google Filipino voice.');
      }
    } else {
      preferred = voices.find(v =>
        v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Natural')
      ) || voices.find(v => v.lang.startsWith('en'));
    }

    const finalText = usePhoneticFix ? preprocessFilipinoForTTS(text) : text;

    const utterance = new SpeechSynthesisUtterance(finalText);
    utterance.rate = isFilipino ? 1.0 : 1.0;
    utterance.pitch = isFilipino ? 1.1 : 1.0;
    utterance.lang = usePhoneticFix ? 'en-US' : (isFilipino ? 'fil-PH' : lang);

    if (preferred) {
      utterance.voice = preferred;
      console.log('[TTS] Voice:', preferred.name, preferred.lang, usePhoneticFix ? '(phonetic mode)' : '(native)');
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    synth.speak(utterance);
  }, [lang]);

  const stopSpeaking = useCallback(() => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    // Stop browser TTS
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { listening, speaking, interim, startListening, stopListening, speak, stopSpeaking };
}
