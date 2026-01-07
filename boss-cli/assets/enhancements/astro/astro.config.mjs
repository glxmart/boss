import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      // Apply Tailwind's base styles
      applyBaseStyles: true,
    }),
  ],
  output: 'static',
  build: {
    // Generate assets with content hashes
    assets: '_assets',
  },
});
