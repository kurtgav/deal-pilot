import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionStore } from '../store/sessionStore';
import { supabase } from '../lib/supabase';

export function useSocket(sessionId: string, onAgentResponse?: (text: string) => void, onAgentThinking?: (thinking: boolean) => void) {
  const socketRef = useRef<Socket | null>(null);
  const { addTranscriptLine, updateFields, setScore, setMuted, setLatency, hydrate } = useSessionStore();

  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (cancelled) return;

      socket = io(import.meta.env.VITE_API_URL || undefined, { auth: { token } });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket!.emit('session:join', { sessionId });
      });
      socket.on('connect_error', (err) => console.error('[Socket] Connection error:', err.message));
      socket.on('state:snapshot', hydrate);
      socket.on('transcript:update', addTranscriptLine);
      socket.on('fields:update', updateFields);
      socket.on('score:update', ({ score }) => setScore(score));
      socket.on('agent:response', ({ text }) => onAgentResponse?.(text));
      socket.on('agent:thinking', ({ thinking }) => onAgentThinking?.(thinking));
      socket.on('latency:update', ({ total_ms }) => { if (typeof total_ms === 'number') setLatency(total_ms); });
    })();

    return () => { cancelled = true; socket?.disconnect(); };
  }, [sessionId]);

  const sendTranscript = (text: string) => {
    socketRef.current?.emit('voice:transcript', { text, speaker: 'PROSPECT' });
  };

  const sendAudio = (chunk: ArrayBuffer) => {
    socketRef.current?.emit('voice:audio', chunk);
  };

  const muteAgent = (sid: string) => {
    socketRef.current?.emit('agent:mute', { sessionId: sid });
    setMuted(true);
  };

  const unmuteAgent = (sid: string) => {
    socketRef.current?.emit('agent:unmute', { sessionId: sid });
    setMuted(false);
  };

  return { sendTranscript, sendAudio, muteAgent, unmuteAgent };
}
