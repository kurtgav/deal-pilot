export type SttTransport = 'browser' | 'deepgram';

/**
 * Choose the STT transport. The browser Web Speech API is Chrome-only, so on
 * browsers without it (Safari, Firefox) we fall back to streaming mic audio to
 * the server's Deepgram pipeline — the PRD requires Chrome AND Safari support.
 *
 * `override` mirrors VITE_STT_TRANSPORT: 'browser'/'deepgram' force a transport;
 * 'auto' (or unset) picks based on Web Speech availability.
 */
export function pickSttTransport(
  hasWebSpeech: boolean,
  override?: string,
): SttTransport {
  if (override === 'browser' || override === 'deepgram') return override;
  return hasWebSpeech ? 'browser' : 'deepgram';
}
