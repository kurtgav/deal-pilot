import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Validate required public env at config time so production builds fail
  // loudly instead of shipping a bundle that can't authenticate.
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production') {
    const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].filter((k) => !env[k]);
    if (missing.length) {
      throw new Error(`[vite] Missing required env vars for production build: ${missing.join(', ')}`);
    }
  }
  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, proxy: { '/api': 'http://localhost:3001', '/socket.io': { target: 'http://localhost:3001', ws: true } } },
  };
});
