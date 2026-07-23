# 0005 — FastAPI + Postgres for phases 3–4, scoped to serving projects

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** 3–4

## Context

No backend is needed today, but the codebase must not have to be rewritten when one
arrives. The chosen scope for that backend is narrow and deliberate: **serve project data
from a database**. Admin CRUD, auth, blog, and analytics were explicitly considered and
placed in the backlog.

## Decision

- **Phase 3:** a FastAPI service in `backend/` with Pydantic models mirroring
  `frontend/src/lib/schema.ts`, implementing `contracts/openapi.yaml`. Data is still read
  from the same JSON files — this phase proves the *wire*, not the storage. Splitting it
  this way means exactly one variable changes at a time when debugging.
- **Phase 4:** `postgres:17-alpine` with a named volume, SQLAlchemy models, Alembic
  migrations, and a seed command that loads the existing JSON into the database. Routes
  are unchanged; only the layer behind them is swapped.

The zod schemas in `schema.ts` are the canonical contract. Pydantic models are written to
match them, so the JSON shape the frontend already consumes *is* the future API response
shape — the frontend needs no adaptation layer.

## Alternatives considered

- **Spring Boot + Java** — matches the Java/Spring work already on the user's GitHub and
  would double as a showcase piece. Not chosen: Python was preferred.
- **Node + Express/Fastify** — would share types with the frontend directly rather than
  mirroring them by hand. Not chosen for the same reason.
- **Going straight to Postgres in Phase 3** — fewer steps, but bundles "does HTTP work"
  and "does persistence work" into one debugging surface.

## Consequences

- The zod ↔ Pydantic mirror is maintained **by hand**, so schema drift is possible. The
  Phase 3 verification step (byte-diff the rendered project markup between
  `PUBLIC_DATA_SOURCE=static` and `=api`) is what catches it.
- Phase 3 has no auth. The API is only reachable through nginx's `/api/` proxy on the same
  origin, and serves public portfolio content — acceptable for read-only endpoints, and it
  must stay read-only until auth exists.
- Generating TypeScript types from the OpenAPI spec would remove the hand-mirroring;
  deliberately deferred to keep Phase 3 small.

## Revisit when

Any backlog item that needs writes (admin panel, contact form, analytics) is picked up —
at that point auth stops being optional.
