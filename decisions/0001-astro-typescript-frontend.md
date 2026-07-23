# 0001 — Use Astro + TypeScript for the frontend

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** 1

## Context

The site is a personal portfolio: mostly static content (bio, project write-ups, skills,
experience) with two small pieces of interactivity — a theme toggle and a tech-stack
filter on the project grid. It must be served by nginx from a Docker container as
prebuilt static files, and must later consume a REST API without a rewrite.

## Decision

Astro 5 with TypeScript in `strict` mode, building to static output (`dist/`). No UI
framework integration by default — interactivity is written as small vanilla TypeScript
islands. A React/Preact integration can be added later if something genuinely warrants it.

## Alternatives considered

- **Vite + React + TypeScript** — perfectly viable, but ships a runtime and hydrates the
  whole page for what is fundamentally a document. Astro gives the same component
  ergonomics with near-zero JS delivered.
- **Plain HTML + CSS + vanilla JS** — no build step and the smallest image, but every
  project card would be hand-maintained markup, and the Phase 3 API swap would mean
  hand-rolled DOM rendering.
- **Next.js static export** — heavier container, more configuration, and its main
  advantage (SSR) isn't needed; the backend in Phase 3 is a separate FastAPI service, not
  a Next.js server.

## Consequences

- Excellent Lighthouse scores essentially for free; important because the site is served
  through an ngrok tunnel where every kilobyte costs latency.
- Data fetching happens at **build time**, so a Phase 3 content change requires a rebuild.
  Accepted: portfolio content changes rarely. If live updates ever matter, Astro's SSR
  adapter is the escape hatch (see [0006](0006-provider-abstraction-over-content-collections.md)).
- Team familiarity is lower than React, but the surface actually used here is small.

## Revisit when

The site needs authenticated, per-request, or frequently-changing content — e.g. if the
admin-panel backlog item is ever picked up.
