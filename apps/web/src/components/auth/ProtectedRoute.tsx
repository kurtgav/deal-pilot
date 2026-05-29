import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Permission, Role } from '@dealpilot/shared';
import { useAuth } from '../../hooks/useAuth';
import { useRBAC } from '../../hooks/useRBAC';

type Props = {
  /** Optional render override (otherwise renders <Outlet/>). */
  children?: ReactNode;
  /** Require ANY of these permissions; user is rejected with 403 otherwise. */
  requiredPermissions?: Permission[];
  /** Require ANY of these roles; user is rejected with 403 otherwise. */
  requiredRoles?: Role[];
};

/**
 * Gates a route on three levels, in order:
 *   1. Authenticated? → if not, redirect to /login (preserving intended path)
 *   2. Has any required role? → if not, render Forbidden
 *   3. Has any required permission? → if not, render Forbidden
 *
 * While auth state is loading on first mount, renders a small spinner
 * to avoid a flash of the redirect.
 */
export default function ProtectedRoute({
  children,
  requiredPermissions,
  requiredRoles,
}: Props) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAnyPermission, hasAnyRole } = useRBAC();

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (requiredRoles?.length && !hasAnyRole(requiredRoles)) {
    return <Forbidden />;
  }

  if (requiredPermissions?.length && !hasAnyPermission(requiredPermissions)) {
    return <Forbidden />;
  }

  return <>{children ?? <Outlet />}</>;
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-zinc-900 animate-spin" />
    </div>
  );
}

function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-6">
      <div className="max-w-md text-center">
        <div className="text-[13px] font-medium text-slate-400 uppercase tracking-wider">403</div>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-slate-900">
          You don&apos;t have access to this page
        </h1>
        <p className="mt-2 text-[14px] text-slate-500">
          Contact an administrator if you believe this is a mistake.
        </p>
        <a
          href="/app"
          className="mt-5 inline-flex items-center px-4 py-2 rounded-lg bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-800 transition"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
