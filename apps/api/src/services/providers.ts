/**
 * Vendor abstraction seam. Orchestration code (SocketServer, AIAgent) depends
 * on these interfaces — never on a specific vendor SDK — so NIM/Deepgram/
 * ElevenLabs can be swapped (e.g. for a realtime speech-to-speech model)
 * without touching business logic.
 */
import { callLLM } from './AIAgent.js';
import { createDeepgramStream, type DeepgramStream } from './DeepgramSTT.js';
import { synthesizeSpeechElevenLabs } from './VoicePipeline.js';

export interface LanguageModel {
  complete(system: string, user: string): Promise<string>;
}

export interface SpeechToText {
  /** Open a streaming session; onTranscript fires with final utterances. */
  stream(onTranscript: (text: string) => void): DeepgramStream;
}

export interface TextToSpeech {
  /** Synthesize speech; returns audio bytes or null when unavailable. */
  synthesize(text: string): Promise<Buffer | null>;
}

class NimLanguageModel implements LanguageModel {
  complete(system: string, user: string): Promise<string> {
    return callLLM(system, user);
  }
}

class DeepgramSpeechToText implements SpeechToText {
  stream(onTranscript: (text: string) => void): DeepgramStream {
    return createDeepgramStream(onTranscript);
  }
}

class ElevenLabsTextToSpeech implements TextToSpeech {
  synthesize(text: string): Promise<Buffer | null> {
    return synthesizeSpeechElevenLabs({ text });
  }
}

// Default wiring. Swap these factories to change vendors.
export const languageModel: LanguageModel = new NimLanguageModel();
export const speechToText: SpeechToText = new DeepgramSpeechToText();
export const textToSpeech: TextToSpeech = new ElevenLabsTextToSpeech();
