import { defineConfig } from 'astro/config';

// Fully static output. The Cloudflare Worker in /worker serves dist/ and proxies /api/*.
export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  devToolbar: { enabled: false },
  vite: { server: { proxy: { '/api': 'http://127.0.0.1:8787' } } }
});
