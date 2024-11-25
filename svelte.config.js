import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',  // This is crucial for client-side routing
      precompress: false,
      strict: true
    }),
    paths: {
      base: process.env.NODE_ENV === 'production' ? '/your-repo-name' : ''
    },
    prerender: {
      handleMissingId: 'warn'  // Helps with dynamic routes
    }
  }
};

export default config;