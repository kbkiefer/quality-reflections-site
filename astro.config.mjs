import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.SITE || undefined,
  base: process.env.BASE || '/',
  integrations: [
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    assets: '_assets',
  },
});
