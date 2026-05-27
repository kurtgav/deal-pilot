import { useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';

export function useSession(sessionId: string | undefined) {
  const { reset } = useSessionStore();

  useEffect(() => {
    reset();
  }, [sessionId]);
}
