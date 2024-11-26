import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api/league': {
        target: 'https://127.0.0.1:2999',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/league/, ''),
      },
    },
  },
});