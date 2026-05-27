import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(currentDir, '..');
const repoRoot = resolve(apiRoot, '..', '..');

const envFiles = [
  resolve(apiRoot, '.env'),
  resolve(repoRoot, '.env'),
];

const loadedFiles: string[] = [];

for (const path of envFiles) {
  if (existsSync(path)) {
    dotenv.config({ path });
    loadedFiles.push(path);
  }
}

const nvidiaKeyPresent = Boolean(process.env.NVIDIA_NIM_API_KEY);
const loadedFrom = loadedFiles.length ? loadedFiles.join(', ') : 'none';

console.log(
  `[env] NVIDIA_NIM_API_KEY present: ${nvidiaKeyPresent ? 'yes' : 'no'}; loaded .env files: ${loadedFrom}`
);

