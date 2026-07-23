# 0008 — Phase boundaries and what defines "done"

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** all

## Context

The project was explicitly requested as phase-wise development, with the backend and
database arriving later. Phases are only useful if each one ends at a state that is
independently working and verifiable — otherwise they are just labels on a single big
build.

## Decision

Each phase ends at a **demonstrably working state**, and the next phase changes exactly
one dimension.

| Phase | Adds | Done when |
|---|---|---|
| 0 | Toolchain, repo skeleton, tracking files | `node`/`docker` available; `tasks.md` + `decisions/` exist |
| 1 | Astro static site, curated data, GitHub enrichment | Site builds and runs on `localhost:4321` with every section rendering; builds successfully with no network |
| 2 | Docker, nginx, ngrok | `docker compose up --build` serves the site locally *and* at the public static URL |
| 3 | FastAPI, still JSON-backed | Site renders identically with `PUBLIC_DATA_SOURCE=api` |
| 4 | Postgres, migrations, seed | API output unchanged; data survives `down`/`up` |

Two consequences of this shape are worth stating explicitly:

- **Phase 3 changes transport only, Phase 4 changes storage only.** Bundling them would
  mean debugging "is it HTTP or is it SQL" simultaneously.
- **Phase 1 is the largest phase by far** and is where the design and content work lives.
  Phases 2–4 are mostly infrastructure.

## Development workflow

`npm run dev` locally for day-to-day work (instant hot reload); `docker compose up --build`
to verify what actually ships. The container path is the source of truth for "does it
work", the local path is the source of truth for "is it fast to build".

## Alternatives considered

- **Containerise first, then build the site** — validates the deployment path earliest, but
  makes the whole design phase run through slow image rebuilds.
- **Build everything, then split into phases retroactively** — no forcing function to keep
  the provider seam ([0006](0006-provider-abstraction-over-content-collections.md)) honest.

## Consequences

- Every phase boundary has a concrete verification step, recorded in `tasks.md`.
- Backlog items (admin CRUD, auth, blog, analytics, CI, real hosting) are deliberately
  unscheduled. They are recorded so they aren't forgotten, not queued.

## Revisit when

A phase's verification step can't be met without pulling work forward from a later phase —
that means the boundary was drawn in the wrong place.
