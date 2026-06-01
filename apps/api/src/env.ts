import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(currentDir, '..');
const repoRoot = resolve(apiRoot, '..', '..');

// Load root first, then the app-specific .env LAST with override so
// per-app values win over both the repo-root .env and any stale vars
// already present in the shell environment (dotenv won't override
// existing process.env values unless override:true is set).
const envFiles = [
  resolve(repoRoot, '.env'),
  resolve(apiRoot, '.env'),
];

const loadedFiles: string[] = [];

for (const path of envFiles) {
  if (existsSync(path)) {
    dotenv.config({ path, override: true });
    loadedFiles.push(path);
  }
}

const nvidiaKeyPresent = Boolean(process.env.NVIDIA_NIM_API_KEY);
const loadedFrom = loadedFiles.length ? loadedFiles.join(', ') : 'none';

console.log(
  `[env] NVIDIA_NIM_API_KEY present: ${nvidiaKeyPresent ? 'yes' : 'no'}; loaded .env files: ${loadedFrom}`
);
if (process.env.DEMO_MODE === 'true') {
  console.log('[env] DEMO_MODE=true — LLM served by canned responses; no external AI keys required.');
}

// Fail fast on missing required configuration instead of crashing later at
// the first DB/auth call with an opaque error. Under DEMO_MODE the LLM is
// served by canned responses, so the NVIDIA key is not required.
const demoMode = process.env.DEMO_MODE === 'true';
const REQUIRED = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  ...(demoMode ? [] : ['NVIDIA_NIM_API_KEY'])];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `[env] FATAL: missing required environment variables: ${missing.join(', ')}.\n` +
      `      Set them in apps/api/.env (see apps/api/.env.example), then restart.`,
  );
  process.exit(1);
}

// Warn (don't fail) on optional integrations so the app still boots for demos.
for (const k of ['DEEPGRAM_API_KEY', 'ELEVENLABS_API_KEY']) {
  if (!process.env[k]) console.warn(`[env] ${k} not set — related feature will use a fallback or be disabled.`);
}

