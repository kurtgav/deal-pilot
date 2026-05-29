/**
 * Shape of the JWT claims after our custom_access_token_hook runs.
 * These are merged with Supabase's standard claims (sub, exp, etc.).
 *
 * NOTE: jwt-decode does not validate the signature — it only parses
 * the JWT payload. Signature verification is performed by Supabase
 * Auth on the server side (and PostgREST when used via REST). The
 * client treats the JWT as a structured cookie of attributes already
 * minted by a trusted issuer.
 */
export interface RBACClaims {
  /** Supabase user id (auth.users.id). */
  sub: string;
  /** Expiry as Unix epoch seconds. */
  exp: number;
  /** Roles assigned to the user (e.g. ['admin']). Empty array if none. */
  user_roles: string[];
  /** Flattened, deduplicated permissions across all of the user's roles. */
  user_permissions: string[];
  /** Forward-compatible: any future claims Supabase or our app may add. */
  [key: string]: unknown;
}

/**
 * Built-in role names. Using `(string & {})` lets callers also pass
 * custom role strings without losing autocomplete on the known ones.
 */
export type Role =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'user'
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

/**
 * Built-in permission names following `resource.action` convention.
 * Keep in sync with the seed migration (20260529000004_seed_rbac.sql).
 */
export type Permission =
  | 'documents.read'
  | 'documents.read_any'
  | 'documents.create'
  | 'documents.update'
  | 'documents.update_any'
  | 'documents.delete'
  | 'documents.delete_any'
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'roles.read'
  | 'roles.manage'
  | 'billing.read'
  | 'billing.manage'
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});
