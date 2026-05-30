import { useRef, useState, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
} from 'agora-rtc-sdk-ng';

AgoraRTC.setLogLevel(3); // Errors only

export interface UseVoiceOptions {
  channel: string;
  uid?: number;
  onRemoteUserJoined?: (uid: number) => void;
  onRemoteUserLeft?: (uid: number) => void;
}

export function useVoice({ channel, uid = 0, onRemoteUserJoined, onRemoteUserLeft }: UseVoiceOptions) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const remoteTracksRef = useRef<Map<number, IRemoteAudioTrack>>(new Map());

  const [joined, setJoined] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);

  const join = useCallback(async () => {
    // Fetch token from backend
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/agora/token?channel=${channel}&uid=${uid}`);
    const { token, appId } = await res.json();

    // Create client
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    // Subscribe to remote users
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        const remoteTrack = user.audioTrack!;
        remoteTrack.play();
        remoteTracksRef.current.set(user.uid as number, remoteTrack);
        setRemoteUsers((prev) => [...prev, user.uid as number]);
        onRemoteUserJoined?.(user.uid as number);
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        remoteTracksRef.current.delete(user.uid as number);
        setRemoteUsers((prev) => prev.filter((id) => id !== user.uid));
      }
    });

    client.on('user-left', (user) => {
      remoteTracksRef.current.delete(user.uid as number);
      setRemoteUsers((prev) => prev.filter((id) => id !== user.uid));
      onRemoteUserLeft?.(user.uid as number);
    });

    // Join channel
    await client.join(appId, channel, token, uid);

    // Create and publish microphone track
    const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localTrackRef.current = micTrack;
    await client.publish(micTrack);

    setJoined(true);
  }, [channel, uid, onRemoteUserJoined, onRemoteUserLeft]);

  const leave = useCallback(async () => {
    localTrackRef.current?.close();
    localTrackRef.current = null;
    remoteTracksRef.current.clear();
    await clientRef.current?.leave();
    clientRef.current = null;
    setJoined(false);
    setRemoteUsers([]);
  }, []);

  const toggleMic = useCallback(async () => {
    if (!localTrackRef.current) return;
    await localTrackRef.current.setEnabled(micMuted);
    setMicMuted(!micMuted);
  }, [micMuted]);

  const muteMic = useCallback(async () => {
    if (!localTrackRef.current) return;
    await localTrackRef.current.setEnabled(false);
    setMicMuted(true);
  }, []);

  const unmuteMic = useCallback(async () => {
    if (!localTrackRef.current) return;
    await localTrackRef.current.setEnabled(true);
    setMicMuted(false);
  }, []);

  return {
    join,
    leave,
    joined,
    micMuted,
    toggleMic,
    muteMic,
    unmuteMic,
    remoteUsers,
    localTrack: localTrackRef,
  };
}
