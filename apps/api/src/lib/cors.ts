/** Parse CORS_ORIGIN (comma-separated) into an allowlist for Express + Socket.io. */
export function corsOrigins(): string[] {
  return (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
