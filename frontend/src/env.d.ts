/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** "static" (JSON files) or "api" (FastAPI backend). See src/lib/providers/index.ts */
  readonly PUBLIC_DATA_SOURCE?: 'static' | 'api';
  /** Base URL for the api provider. Empty means same-origin via the nginx proxy. */
  readonly PUBLIC_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
