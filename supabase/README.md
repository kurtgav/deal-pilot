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

## PII & data retention (Golden Rule #4)

> **Golden Rule #4:** the AI will not store or log prospect PII beyond session
> scope. No persistent prospect profiles without consent.

### Where prospect PII lives

| Store | PII content | Retention |
| ----- | ----------- | --------- |
| `call_sessions.transcript` (JSONB) | **Verbatim** — names/emails/phones spoken aloud | Bounded review TTL, then purged (see below) |
| `call_sessions.extracted_fields` | Structured business signals (use case, budget) — not raw contact PII | Retained with session |
| `handoffs.summary` / `crm_json` | The rep-exported deliverable (PRD F5.1/F5.3) | Retained — this is the explicit export |
| consent log | One-way **SHA-256 IP hash** only, never the raw IP | In-memory audit line |
| application logs | No raw PII (consent logs the hash; errors never echo transcripts) | — |

### Why TTL purge, not delete-on-export

PRD F5.1 makes the full transcript a handoff deliverable the rep reviews after
the call, so deleting it the instant a handoff is generated would break the
review flow. Instead the verbatim transcript is kept for a bounded **review
window** then auto-purged — satisfying "beyond session scope" while preserving
the rep's post-call review. The exported business artifacts (`summary`,
`crm_json`) survive; only the raw PII-bearing transcript is emptied.

### Controls

- **Retention sweep** (`services/retention.ts`): on server boot and hourly, any
  `ended` session whose `ended_at` is older than `TRANSCRIPT_TTL_HOURS`
  (default **24h**) has its `transcript` emptied. Pure cutoff math, delegating
  to `repo.purgeExpiredTranscripts(cutoffIso)`.
- **Redaction at rest** (opt-in): set `PII_REDACTION=true` and every
  `saveSession` masks emails/phones (`[redacted-email]` / `[redacted-phone]`)
  before the transcript is written — verbatim PII never touches Postgres.
- **Per-session isolation**: sessions/handoffs are owned by `user_id`; RLS
  policies (`sessions_all`, `handoffs_all`) restrict rows to the owner, and the
  API double-checks ownership in app code (`denyIfNotOwner`) because the
  service role bypasses RLS.

### Config

| Env var | Default | Effect |
| ------- | ------- | ------ |
| `TRANSCRIPT_TTL_HOURS` | `24` | Hours an ended session's transcript is kept before purge |
| `PII_REDACTION` | _(off)_ | `true` masks emails/phones in transcripts at write time |

### Tests

```sh
pnpm --filter @dealpilot/api test   # includes pii.test.ts + retention.test.ts
```

Covers email/phone masking, per-session scoping (only the passed lines are
redacted, input is not mutated), TTL config, and that the sweep purges with a
cutoff exactly `TRANSCRIPT_TTL_HOURS` before now.

## Demo mode (key-less, deterministic)

> **Demo-success bar (PRD):** an end-to-end call completes, ≥6 copilot fields
> populate, and a valid CRM payload + follow-up email generate — every time.

`DEMO_MODE=true` makes a full call run with **zero external AI keys**, so a
judge demo can never be broken by a cold/rate-limited/missing key:

- **LLM** — `callLLM()` short-circuits to canned, deterministic responses
  (`apps/api/src/lib/demo.ts`): stage-aware agent replies, field-extraction
  JSON, and the handoff summary/email. No network call is made.
- **STT** — the browser Web Speech API is the default transport (no key); the
  server-side Deepgram path no-ops without `DEEPGRAM_API_KEY`.
- **TTS** — `/api/tts` returns 503 without `ELEVENLABS_API_KEY` and the client
  falls back to the browser `SpeechSynthesis` voice.
- **env gate** — under `DEMO_MODE` the `NVIDIA_NIM_API_KEY` requirement is
  dropped, so the API boots with only the Supabase vars set.

```sh
DEMO_MODE=true pnpm dev:api    # boots with no AI keys; canned LLM responses
```

The scripted scenario lives in `DEMO_SCRIPT` (`apps/api/src/lib/demo.ts`): six
prospect turns that populate 8 fields (industry, use case, pain points,
urgency, budget, technical fit, objection, next step). The smoke test
`apps/api/src/lib/demo.test.ts` runs that script through the **real** field
extractor and handoff generator with all AI keys removed, asserting ≥6 fields
and a valid CRM payload — a regression guard on the demo-success bar.

## Cross-browser voice & latency

### STT transport (Chrome + Safari)

The browser Web Speech API is **Chrome-only**, but the PRD requires Chrome AND
Safari. `pickSttTransport()` (`packages/shared/src/voice/transport.ts`) chooses
at runtime:

- **Chrome** → `browser` (Web Speech API, lowest latency, no server key).
- **Safari / Firefox** → `deepgram` — the mic is captured with `MediaRecorder`
  and streamed to the server's Deepgram pipeline, which loops transcripts back
  over the socket. Requires `DEEPGRAM_API_KEY` on the API.

Override with `VITE_STT_TRANSPORT=browser|deepgram` (default `auto`). The picker
is pure and unit-tested (`transport.test.ts`).

### Latency vs the 1.5s NFR

The PRD requires the AI voice response to begin within **1.5s** of the
prospect's utterance end. The server emits `latency:update` per turn; the client
accumulates samples and reports the distribution:

- Live in the call header: `p50 … · p95 …` (turns amber if p95 > 1.5s).
- On **End Call**, a console line: `[latency] n=… p50=…ms p95=…ms within 1.5s
  target: …%`.

`latencyStats()` (`packages/shared/src/voice/latency.ts`, nearest-rank
percentiles, unit-tested) is the single source of truth for these numbers.

### Deferred: streamed TTS

Today `/api/tts` returns the full MP3 before playback begins, which adds the
synthesis time to the first-audio latency. Streaming the audio (chunked
transfer + `MediaSource`) would cut time-to-first-audio meaningfully. It's
**deferred**: it needs a real-device latency baseline to tune against and a
`MediaSource` fallback path for Safari, so it's scoped as a follow-up rather
than rushed. The measurement above is the prerequisite that makes that work
verifiable.

## Eval scoreboard & embedding providers

### The scoreboard

`pnpm --filter @dealpilot/api eval` is the AI-quality scoreboard:

- **Grounding / hallucination** (offline, deterministic) — for each labeled
  product question, does the grounding gate answer from the KB or escalate?
  Out-of-KB questions answered instead of escalated are hallucinations.
- **Field extraction** precision/recall — needs a real LLM key, so it's
  **skipped** when `NVIDIA_NIM_API_KEY` is unset.

### Nightly CI

`.github/workflows/eval.yml` runs the eval nightly (07:00 UTC) and on manual
dispatch, with `NVIDIA_NIM_API_KEY` from repo secrets — so extraction
precision/recall is tracked over time instead of skipped in the per-PR gate.
Set the secret in **Settings → Secrets → Actions**.

### Embedding providers (behind a sync seam)

Grounding similarity runs through `EmbeddingProvider` (`services/embeddings.ts`):

- `tfidf` (default) — offline, deterministic, **synchronous**. Zero voice-turn
  latency.
- `hosted` — NVIDIA NIM semantic embeddings (`NIM_EMBED_MODEL`). To keep
  `embed()` synchronous, the provider `prewarm()`s the KB docs (and, in eval,
  the queries) into a cache; `embed()` serves from cache and falls back to
  TF-IDF on any miss/failure, so a voice turn never blocks on the network.

Select with `EMBEDDING_PROVIDER=tfidf|hosted`.

### A/B before you swap — and why the threshold matters

```sh
EVAL_COMPARE=1 pnpm --filter @dealpilot/api eval
```

prints in-KB recall and hallucination rate for **both** providers at the
current grounding threshold (`0.11`). A live run surfaced the key finding:

| provider | in-KB recall | hallucination |
| -------- | -----------: | ------------: |
| tfidf    | 75%          | **0%**        |
| hosted   | 100%         | **100%**      |

Dense embeddings sit in a narrow cosine band where *every* query — in-KB and
out-of-KB alike — clears a threshold tuned for sparse TF-IDF. So a naive swap
to `hosted` lifts recall to 100% but makes the agent **fabricate on every
out-of-KB question** — a direct Golden Rule #1 violation. The hosted provider
needs its **own re-tuned threshold** before it can ship. This A/B gate is
exactly what catches that before it reaches a call.
