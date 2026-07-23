# 0003 — nginx serves prebuilt static output from a multi-stage image

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** 2

## Context

The site must run in a Docker container with nginx serving the page. Astro produces a
`dist/` directory of static assets with content-hashed filenames under `_astro/`.

## Decision

A multi-stage `frontend/Dockerfile`:

1. **Build stage** — `node:22-alpine`, `npm ci`, `npm run build`.
2. **Runtime stage** — `nginx:1.27-alpine`, `dist/` copied to `/usr/share/nginx/html`,
   plus `nginx/default.conf`.

The runtime image contains no Node.js, no source, and no `node_modules`. nginx config
covers: gzip on text types, `Cache-Control: immutable` with a long TTL for hashed
`/_astro/*` assets and a short TTL for HTML, `X-Content-Type-Options`, `Referrer-Policy`
and a starter CSP, a `/healthz` endpoint returning 200 for compose health checks, and a
**commented-out** `location /api/ { proxy_pass http://api:8000/; }` block that Phase 3
uncomments.

## Alternatives considered

- **Single-stage image with Node serving the site** — larger attack surface, larger image,
  and a Node process to supervise for zero benefit on static files.
- **Build on the host, `COPY dist/`** — faster iteration but makes the image depend on the
  host's Node version and on someone remembering to build first. Reproducibility wins.

## Consequences

- Small, boring, fast runtime image; nginx is the right tool for static files.
- Every content change requires an image rebuild (`docker compose up --build`). Mitigated
  by doing day-to-day work with `npm run dev` locally — see
  [0008](0008-phase-boundaries.md).
- The `/api/` proxy sitting in the config as a comment means Phase 3 requires no new nginx
  knowledge, just an uncomment.

## Revisit when

Assets need to be served from a CDN, or the site moves to real hosting.
