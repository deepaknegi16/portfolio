// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/*
 * The site URL lives in profile.json alongside the rest of the content, so
 * there is exactly one place to change it when the ngrok domain is claimed.
 * Read rather than imported to avoid depending on import-attribute support.
 */
const profile = JSON.parse(
  readFileSync(new URL('./src/data/profile.json', import.meta.url), 'utf8'),
);

const site = profile.seo?.siteUrl;

// https://astro.build/config
export default defineConfig({
  site,
  // Static output: nginx serves the built files directly.
  // See decisions/0003-nginx-static-in-docker.md
  output: 'static',
  integrations: [sitemap()],
  build: {
    // Emit /projects/<slug>/index.html so nginx needs no rewrite rules.
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
