import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { RBACClient, type Permission, type Role } from '@dealpilot/shared';
import { supabaseAuth } from '../lib/supabase.js';

/**
 * The shape attached to req.user after successful authentication.
 */
export interface AuthedUser {
  id: string;
  email: string | null;
  rbac: RBACClient;
}

// Augment Express's Request type so handlers see req.user without casting.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

/**
 * requireAuth: validates the Authorization Bearer token via Supabase Auth.
 *
 * SECURITY: We use supabaseAuth.auth.getUser(token), which performs a
 * cryptographically-verified validation against Supabase Auth (it
 * checks the signature and expiry server-side). This is the recommended
 * pattern — `jwt-decode` alone is NOT signature verification.
 *
 * After validation, we attach an RBACClient (which decodes the same
 * token to read user_roles/user_permissions claims) to req.user so
 * downstream middlewares can do permission checks without a DB hit.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    return;
  }

  try {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) {
      res.status(401).json({ error: 'Invalid or expired session.' });
      return;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      rbac: new RBACClient(token),
    };
    next();
  } catch (err) {
    // Network/timeouts contacting Supabase Auth — fail closed.
    console.error('[auth] verification failed', err);
    res.status(503).json({ error: 'Auth service unavailable.' });
  }
};

/**
 * requirePermission: factory that returns a middleware enforcing the
 * given permission. Must be chained AFTER requireAuth.
 *
 * Usage:
 *   router.delete('/:id', requireAuth, requirePermission('documents.delete'), handler)
 */
export function requirePermission(permission: Permission): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!req.user.rbac.hasPermission(permission)) {
      res.status(403).json({ error: 'Insufficient permission.', required: permission });
      return;
    }
    next();
  };
}

/**
 * requireAnyPermission: passes if the user has AT LEAST ONE of the
 * provided permissions. Must be chained AFTER requireAuth.
 */
export function requireAnyPermission(permissions: Permission[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!req.user.rbac.hasAnyPermission(permissions)) {
      res
        .status(403)
        .json({ error: 'Insufficient permissions.', requiredAny: permissions });
      return;
    }
    next();
  };
}

/**
 * requireRole: passes if the user has the given role. Must be chained
 * AFTER requireAuth.
 */
export function requireRole(role: Role): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!req.user.rbac.hasRole(role)) {
      res.status(403).json({ error: 'Insufficient role.', required: role });
      return;
    }
    next();
  };
}
