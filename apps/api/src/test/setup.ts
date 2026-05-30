// Hermetic test env: provide placeholder Supabase vars BEFORE any module
// imports, so lib/supabase.ts createClient() doesn't throw "supabaseUrl is
// required" in a clean environment (e.g. CI). Tests mock the DB layer; these
// values are never used to make real calls.
process.env.SUPABASE_URL ||= 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.NVIDIA_NIM_API_KEY ||= 'test-nim-key';
