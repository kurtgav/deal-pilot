import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../components/auth/AuthLayout';

/**
 * Landing page for email-confirmation and OAuth redirects.
 *
 * The Supabase client's `detectSessionInUrl: true` option (see
 * lib/supabase.ts) reads the access_token from the URL fragment and
 * persists it before this component even mounts. We just need to wait
 * for the session to materialize via onAuthStateChange and route the
 * user to the app.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    navigate(isAuthenticated ? '/app' : '/login', { replace: true });
  }, [isLoading, isAuthenticated, navigate]);

  return (
    <AuthLayout title="Signing you in…" subtitle="Just a moment.">
      <div className="flex items-center justify-center py-3">
        <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-zinc-900 animate-spin" />
      </div>
    </AuthLayout>
  );
}
