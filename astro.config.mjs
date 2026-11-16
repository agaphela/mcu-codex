import { defineConfig } from 'astro/config';

// GitHub Pages serves this repo at /mcu-codex. Override with SITE_BASE=/ for a custom domain.
export default defineConfig({
  site: 'https://agaphela.github.io',
  base: process.env.SITE_BASE ?? '/mcu-codex',
});
