import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionStore } from '../store/sessionStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export function useSocket(sessionId: string, onAgentResponse?: (text: string) => void) {
  const socketRef = useRef<Socket | null>(null);
  const { addTranscriptLine, updateFields, setScore, setMuted } = useSessionStore();

  useEffect(() => {
    const socket = io({ transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      socket.emit('session:join', { sessionId });
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    socket.on('transcript:update', addTranscriptLine);
    socket.on('fields:update', updateFields);
    socket.on('score:update', ({ score }) => setScore(score));
    socket.on('agent:response', ({ text }) => {
      onAgentResponse?.(text);
    });

    return () => { socket.disconnect(); };
  }, [sessionId]);

  const sendTranscript = (text: string) => {
    socketRef.current?.emit('voice:transcript', { text, speaker: 'PROSPECT' });
  };

  const muteAgent = (sid: string) => {
    socketRef.current?.emit('agent:mute', { sessionId: sid });
    setMuted(true);
  };

  const unmuteAgent = (sid: string) => {
    socketRef.current?.emit('agent:unmute', { sessionId: sid });
    setMuted(false);
  };

  return { sendTranscript, muteAgent, unmuteAgent };
}
