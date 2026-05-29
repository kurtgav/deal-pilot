import WebSocket from 'ws';

/**
 * Deepgram real-time STT. Opens a streaming WebSocket, accepts audio chunks
 * (WebM/Opus from the browser MediaRecorder), and invokes onTranscript with
 * final utterances. Returns a thin controller; if DEEPGRAM_API_KEY is missing
 * send()/close() are no-ops (the client Web Speech fallback covers that case).
 */
const DG_URL =
  'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=false&punctuate=true';

export interface DeepgramStream {
  send: (chunk: ArrayBuffer) => void;
  close: () => void;
}

export function createDeepgramStream(onTranscript: (text: string) => void): DeepgramStream {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.warn('[Deepgram] DEEPGRAM_API_KEY not set — server STT disabled.');
    return { send: () => {}, close: () => {} };
  }

  const ws = new WebSocket(DG_URL, { headers: { Authorization: `Token ${apiKey}` } });
  const queue: ArrayBuffer[] = [];
  let open = false;

  ws.on('open', () => {
    open = true;
    for (const c of queue) ws.send(Buffer.from(c));
    queue.length = 0;
  });

  ws.on('message', (data: WebSocket.RawData) => {
    try {
      const msg = JSON.parse(data.toString());
      const text: string | undefined = msg.channel?.alternatives?.[0]?.transcript;
      if (msg.is_final && text && text.trim()) onTranscript(text.trim());
    } catch {
      /* ignore non-JSON keepalives */
    }
  });

  ws.on('error', (err) => console.warn('[Deepgram] error:', (err as Error).message));

  return {
    send: (chunk: ArrayBuffer) => {
      if (open && ws.readyState === WebSocket.OPEN) ws.send(Buffer.from(chunk));
      else queue.push(chunk);
    },
    close: () => {
      try {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'CloseStream' }));
        ws.close();
      } catch {
        /* noop */
      }
    },
  };
}
