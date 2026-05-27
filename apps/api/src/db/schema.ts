import type { Lead, CallSession, Handoff } from '@dealpilot/shared';

// In-memory store for MVP (swap for SQLite/Postgres later)
export const db = {
  leads: [] as Lead[],
  sessions: [] as CallSession[],
  handoffs: [] as Handoff[],
};
