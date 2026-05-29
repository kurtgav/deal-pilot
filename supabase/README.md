# Supabase RBAC for DealPilot

Production-ready Role-Based Access Control with JWT custom claims.
Roles and permissions are injected into the access token at sign-in
time, so RLS policies can authorize requests with **zero database
queries**.

## Architecture overview

```
┌──────────────┐  sign-in  ┌──────────────┐  hook  ┌────────────────────┐
│  Client app  │ ────────▶ │  Auth server │ ─────▶ │ custom_access_     │
└──────────────┘           └──────────────┘        │ token_hook(event)  │
       ▲                          │                 │ (PL/pgSQL)         │
       │                          ▼                 └────────────────────┘
       │                  JWT with claims:                    │
       │                  • user_roles: [...]                 │
       │                  • user_permissions: [...]           ▼
       │                          │                  reads user_roles,
       └──────────────────────────┘                  roles, role_permissions,
                                                     permissions tables

Subsequent requests:
  Client ──(JWT)──▶ Postgres ──▶ RLS policy calls has_permission(...)
                                  which reads auth.jwt() — NO db lookup
```

## File layout

```
supabase/
├── config.toml                                 # local-dev config (hook enabled)
└── migrations/
    ├── 20260529000001_rbac_schema.sql           # tables, FKs, indexes, force RLS
    ├── 20260529000002_jwt_hook.sql              # custom_access_token_hook
    ├── 20260529000003_rls_helpers_and_documents.sql  # has_permission/has_role + example
    └── 20260529000004_seed_rbac.sql             # default roles, perms, super-admin bootstrap

packages/shared/src/rbac/
├── types.ts            # RBACClaims, Role, Permission types
├── RBACClient.ts       # framework-agnostic JWT decoder + checker
└── index.ts            # barrel export

apps/web/src/
├── lib/supabase.ts     # browser Supabase client (anon key)
└── hooks/useRBAC.ts    # React hook (subscribes to auth state)
```

## Prerequisites

```sh
brew install supabase/tap/supabase   # or follow https://supabase.com/docs/guides/cli
```

## Local development

```sh
# Start the local Supabase stack (Postgres, Auth, Studio, etc.)
supabase start

# Apply all migrations to a fresh local DB
supabase db reset
```

After `supabase start`, Studio runs at <http://localhost:54323>. Sign
up a test user via Studio's Authentication tab, then jump to the
**Bootstrap your first super admin** section below.

> **Note on `.env.local`**: the Supabase CLI auto-loads `.env.local`
> from the workdir. If you see `failed to parse environment file:
> .env.local (unexpected character ...)`, it's an issue with your
> existing env file (e.g. a value containing a literal `+` in the
> KEY portion). Either fix the file or run with `--workdir` from a
> directory without it.

## Production deployment

```sh
# Link to your Supabase project (one-time)
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

### CRITICAL: enable the Custom Access Token Hook in production

`config.toml` enables the hook for **local dev only**. For your hosted
project you must enable it in the dashboard:

1. Open **Authentication → Hooks** in your Supabase dashboard
2. Under **Custom Access Token**, choose **Postgres function**
3. Schema: `public`, Function: `custom_access_token_hook`
4. Save

Once enabled, every sign-in / token refresh will call the hook and the
JWT will contain `user_roles` and `user_permissions` claims. Existing
sessions need to refresh (or the user signs out + in) to receive the
new claims.

## Bootstrap your first super admin

The seed (`20260529000004_seed_rbac.sql`) ships with a placeholder UUID
that is intentionally invalid, so re-running the seed never grants
super_admin to a phantom row.

To grant super_admin to your first user:

1. Sign up your user normally (via the app or Supabase Studio)
2. Copy their UUID from **Authentication → Users**
3. Open `supabase/migrations/20260529000004_seed_rbac.sql`
4. Replace `'00000000-0000-0000-0000-000000000000'` with the real UUID
5. Re-run the seed: `supabase db push` (or apply that migration manually)
6. Have the user sign out and back in to receive the updated JWT claims

> **Why this approach?** No runtime endpoints (no attack surface), no
> env-var-driven privilege escalation, no implicit "first user wins"
> race conditions. The grant is committed to version control with full
> audit history.

## Adding new roles or permissions

Edit `20260529000004_seed_rbac.sql` and add to the `INSERT ... ON
CONFLICT DO NOTHING` blocks. Re-run the seed. Users need to sign out
and back in (or call `supabase.auth.refreshSession()`) to receive the
updated permissions in their JWT.

For role assignments at runtime (granting an existing user a new role),
insert into `public.user_roles` using the **service role** key:

```ts
import { createClient } from '@supabase/supabase-js';
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
await admin.from('user_roles').insert({ user_id, role_id });
// User must refresh their session to see new claims.
```

## How users get updated claims after role changes

Claims live inside the JWT, so new claims appear only when a new JWT is
issued. Three ways to trigger that:

1. **User signs out and back in** (clean, recommended for permission demotions)
2. **Force a token refresh** client-side:
   ```ts
   await supabase.auth.refreshSession();
   ```
3. **Wait for natural refresh** (autoRefreshToken handles this every ~50 minutes)

## Frontend usage (React)

```tsx
import { useRBAC } from './hooks/useRBAC';

function NewDocumentButton() {
  const { hasPermission, isLoading } = useRBAC();
  if (isLoading) return null;
  if (!hasPermission('documents.create')) return null;
  return <button>New document</button>;
}

function AdminPanel() {
  const { isSuperAdmin } = useRBAC();
  if (!isSuperAdmin) return <NotAuthorized />;
  return <SuperAdminUI />;
}
```

## Server-side usage (Express, etc.)

```ts
import { RBACClient } from '@dealpilot/shared';

// In a middleware after extracting the JWT from the Authorization header:
function requirePermission(permission: string) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const rbac = new RBACClient(token);
    if (!rbac.isAuthenticated()) return res.status(401).end();
    if (!rbac.hasPermission(permission)) return res.status(403).end();
    req.user = { id: rbac.getUserId(), roles: rbac.getRoles() };
    next();
  };
}

app.delete('/documents/:id', requirePermission('documents.delete'), handler);
```

> **SECURITY**: `jwt-decode` does NOT verify the JWT signature.
> `RBACClient` is intended for UI gating and permission shaping in
> contexts where the JWT has already been validated upstream
> (Postgres RLS, an API gateway, or `supabase.auth.getUser()`). For
> a security-critical Express endpoint without a gateway, also verify
> the signature with the project's JWT secret using a library like
> `jose` or `jsonwebtoken` before trusting the claims.

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It bypasses RLS.
- The `custom_access_token_hook` function is granted **only** to
  `supabase_auth_admin`. Authenticated users cannot invoke it directly.
- All RBAC tables (`roles`, `permissions`, `role_permissions`,
  `user_roles`) have `force row level security`. Authenticated users
  cannot read them — this prevents enumeration of permissions/roles.
- The seed bootstrap guards against accidental admin grants by
  refusing to run when the placeholder UUID is unchanged.
- `has_permission` and `has_role` are `security invoker` (not definer)
  — they only read the caller's own JWT, so privilege escalation is
  not possible via these helpers.

## Testing the RBACClient

```sh
pnpm --filter @dealpilot/shared test
```

Covers null/empty/malformed input, valid JWTs, expired JWTs, role and
permission checks, super_admin shortcut, and defensive copying.

## Schema reference

| Table              | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| `roles`            | Role catalog (name, description)                   |
| `permissions`      | Permission catalog (`resource.action` names)       |
| `role_permissions` | M2M role↔permission mapping                        |
| `user_roles`       | M2M user↔role mapping (with `created_by` audit)    |
| `documents`        | Example domain table with full RBAC RLS policies   |

## JWT claim shape after the hook

```json
{
  "sub": "8ccaa7af-909f-44e7-84cb-67cdccb56be6",
  "exp": 1715690221,
  "user_roles": ["admin"],
  "user_permissions": [
    "documents.read",
    "documents.create",
    "users.read"
  ],
  ...standard supabase claims (aud, role, aal, session_id, ...)
}
```

## Default role → permission matrix

| Permission              | super_admin | admin | manager | user |
| ----------------------- | :---------: | :---: | :-----: | :--: |
| documents.read          | ✓           | ✓     | ✓       | ✓    |
| documents.read_any      | ✓           | ✓     | ✓       |      |
| documents.create        | ✓           | ✓     | ✓       | ✓    |
| documents.update        | ✓           | ✓     | ✓       | ✓    |
| documents.update_any    | ✓           | ✓     |         |      |
| documents.delete        | ✓           | ✓     | ✓       | ✓    |
| documents.delete_any    | ✓           | ✓     |         |      |
| users.read              | ✓           | ✓     | ✓       |      |
| users.create            | ✓           | ✓     |         |      |
| users.update            | ✓           | ✓     |         |      |
| users.delete            | ✓           | ✓     |         |      |
| roles.read              | ✓           | ✓     | ✓       |      |
| roles.manage            | ✓           |       |         |      |
| billing.read            | ✓           | ✓     | ✓       |      |
| billing.manage          | ✓           | ✓     |         |      |
