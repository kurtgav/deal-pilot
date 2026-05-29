import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  RBACClient,
  type Permission,
  type Role,
} from '@dealpilot/shared';
import { supabase } from '../lib/supabase';

/**
 * Reactive RBAC hook.
 *
 * Subscribes to Supabase auth state and re-renders when the session
 * changes (sign-in, sign-out, token refresh). The underlying RBACClient
 * is memoized on `access_token` so callers can use the returned check
 * functions as stable dependencies in their own hooks.
 *
 * IMPORTANT: claims (roles, permissions) only update when a NEW token
 * is issued. If you grant a user a new role server-side, they need to
 * either sign out + back in, or call `supabase.auth.refreshSession()`
 * to receive updated JWT claims.
 *
 * Example:
 * ```tsx
 *   const { hasPermission, isLoading } = useRBAC();
 *   if (isLoading) return <Spinner />;
 *   return hasPermission('documents.create')
 *     ? <NewDocumentButton />
 *     : null;
 * ```
 */
export function useRBAC() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initial session fetch (handles page reloads with persisted session).
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsLoading(false);
    });

    // Subscribe to all auth state changes (SIGNED_IN, SIGNED_OUT,
    // TOKEN_REFRESHED, USER_UPDATED, etc.) so the UI re-renders with
    // fresh claims whenever they change.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Re-build the client only when access_token changes. Decoding the
  // JWT is cheap, but doing it every render would waste cycles and
  // create unstable identities for the returned callbacks.
  const client = useMemo(
    () => new RBACClient(session?.access_token ?? null),
    [session?.access_token],
  );

  const hasRole = useCallback((r: Role) => client.hasRole(r), [client]);
  const hasAnyRole = useCallback((rs: Role[]) => client.hasAnyRole(rs), [client]);
  const hasPermission = useCallback(
    (p: Permission) => client.hasPermission(p),
    [client],
  );
  const hasAnyPermission = useCallback(
    (ps: Permission[]) => client.hasAnyPermission(ps),
    [client],
  );
  const hasAllPermissions = useCallback(
    (ps: Permission[]) => client.hasAllPermissions(ps),
    [client],
  );

  return {
    isLoading,
    isAuthenticated: client.isAuthenticated(),
    isSuperAdmin: client.isSuperAdmin(),
    userId: client.getUserId(),
    roles: client.getRoles(),
    permissions: client.getPermissions(),
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
