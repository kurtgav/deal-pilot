import { jwtDecode } from 'jwt-decode';
import type { Permission, RBACClaims, Role } from './types.js';

/**
 * Framework-agnostic RBAC checker. Decodes a Supabase JWT once and
 * provides synchronous role/permission checks. Safe to instantiate
 * per request (decoding is cheap — under 10µs) or reuse a single
 * instance across multiple checks.
 *
 * Usage:
 * ```ts
 *   const rbac = new RBACClient(session?.access_token);
 *   if (rbac.hasPermission('documents.read')) { ... }
 * ```
 *
 * Accepted inputs:
 *   - A raw JWT string (the access_token)
 *   - A Supabase Session-like object with `{ access_token: string }`
 *   - null / undefined → represents a logged-out user; all checks
 *     return false. Throws nothing.
 *
 * SECURITY NOTE: jwt-decode does NOT verify the signature. This class
 * is intended for client-side UI gating and server-side checks AFTER
 * the JWT has been validated by Supabase Auth (Postgres RLS or a
 * gateway). Never use it as the sole authorization check on a
 * security-critical endpoint without first verifying the signature.
 */
export class RBACClient {
  private readonly claims: RBACClaims | null;

  constructor(input: string | { access_token?: string | null } | null | undefined) {
    this.claims = RBACClient.parseInput(input);
  }

  private static parseInput(
    input: string | { access_token?: string | null } | null | undefined,
  ): RBACClaims | null {
    if (!input) return null;
    const token = typeof input === 'string' ? input : input.access_token ?? null;
    if (!token) return null;
    try {
      return jwtDecode<RBACClaims>(token);
    } catch {
      // Malformed token → treated as unauthenticated. Don't throw —
      // callers should fall back to "no permissions" gracefully.
      return null;
    }
  }

  /** True if a JWT is present and not yet expired. */
  isAuthenticated(): boolean {
    if (!this.claims?.exp) return false;
    // exp is seconds since epoch (RFC 7519); JS Date.now() is ms.
    return this.claims.exp * 1000 > Date.now();
  }

  /** Supabase user id (`auth.users.id`), or null if no token. */
  getUserId(): string | null {
    return this.claims?.sub ?? null;
  }

  /** Returns a defensive copy so callers can't mutate cached state. */
  getRoles(): string[] {
    return this.claims?.user_roles ? [...this.claims.user_roles] : [];
  }

  /** Returns a defensive copy so callers can't mutate cached state. */
  getPermissions(): string[] {
    return this.claims?.user_permissions ? [...this.claims.user_permissions] : [];
  }

  hasRole(role: Role): boolean {
    return this.claims?.user_roles?.includes(role) ?? false;
  }

  hasAnyRole(roles: Role[]): boolean {
    const owned = this.claims?.user_roles;
    if (!owned?.length) return false;
    return roles.some((r) => owned.includes(r));
  }

  hasPermission(permission: Permission): boolean {
    return this.claims?.user_permissions?.includes(permission) ?? false;
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    const owned = this.claims?.user_permissions;
    if (!owned?.length) return false;
    return permissions.some((p) => owned.includes(p));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    const owned = this.claims?.user_permissions;
    if (!owned?.length) return permissions.length === 0;
    return permissions.every((p) => owned.includes(p));
  }

  /** Convenience: super_admin shortcut for the most common gate. */
  isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }
}
