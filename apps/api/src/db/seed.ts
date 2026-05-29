import '../env.js';
import { supabaseAdmin } from '../lib/supabase.js';

/**
 * Seeds demo leads with NULL owner so every authenticated user sees them.
 * Idempotent: uses fixed ids and upserts. Run with: pnpm --filter @dealpilot/api seed
 */
const seedLeads = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    contact_name: 'Sarah Chen',
    company: 'StreamScale',
    industry: 'EdTech',
    initial_use_case: 'Live tutoring voice rooms needing real-time AI moderation',
    status: 'new',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    contact_name: 'Marcus Johnson',
    company: 'FinFlow',
    industry: 'FinTech',
    initial_use_case: 'Voice-based customer onboarding for banking APIs',
    status: 'new',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    contact_name: 'Priya Patel',
    company: 'DevForge',
    industry: 'Developer Tools',
    initial_use_case: 'AI pair programming with voice commands for IDE plugin',
    status: 'new',
  },
];

const { error } = await supabaseAdmin.from('leads').upsert(seedLeads, { onConflict: 'id' });
if (error) {
  console.error('[seed] failed:', error.message);
  process.exit(1);
}
console.log(`[seed] upserted ${seedLeads.length} demo leads`);
process.exit(0);
