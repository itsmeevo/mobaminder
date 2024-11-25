// src/routes/+layout.js
export const prerender = true;  // Pre-renders all pages at build time
export const ssr = false;       // Disables server-side rendering
export const trailingSlash = 'always';  // Helps with GitHub Pages routing