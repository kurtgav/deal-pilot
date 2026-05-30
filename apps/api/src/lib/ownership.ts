import type { Response } from 'express';

/**
 * Tenant-isolation guard (fixes cross-tenant IDOR). The API talks to Postgres
 * with the service-role key, which BYPASSES RLS — so ownership MUST be checked
 * in app code on every by-ID route.
 *
 * `owner` encodes the lookup result:
 *   - a user id string → the row's owner
 *   - null             → shared/seeded row (no owner) OR (for owner-only
 *                        resources) not found
 *   - undefined        → row does not exist
 *
 * Returns true when access was DENIED (and a 404 has been written). We use 404
 * rather than 403 so we never leak the existence of another tenant's rows.
 *
 * Usage:  if (denyIfNotOwner(res, owner, req.user!.id)) return;
 */
export function denyIfNotOwner(
  res: Response,
  owner: string | null | undefined,
  userId: string,
  allowShared = false,
): boolean {
  const allowed = owner === userId || (allowShared && owner === null);
  if (!allowed) {
    res.status(404).json({ error: 'Not found' });
    return true;
  }
  return false;
}
