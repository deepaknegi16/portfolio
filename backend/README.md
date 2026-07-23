# Backend — Phase 3

**Not built yet.** This directory is a placeholder so the shape of the project is
visible from the start.

When Phase 3 begins, this becomes a FastAPI service implementing
[`../contracts/openapi.yaml`](../contracts/openapi.yaml):

- Pydantic models mirroring `frontend/src/lib/schema.ts`
- `GET /api/profile`, `/api/projects`, `/api/projects/{slug}`, `/api/experience`,
  `/api/skills`, `/health`
- Backed by the same JSON files the static provider reads — Phase 3 proves the
  wire, Phase 4 replaces the storage with Postgres

To switch the frontend over once it exists:

1. Uncomment the `/api/` proxy block in `frontend/nginx/default.conf`
2. Uncomment the `api` service in `docker-compose.yml`
3. Set `PUBLIC_DATA_SOURCE=api` in `.env`

No frontend component changes — that is the whole point of the provider seam.
See [`../decisions/0006-provider-abstraction-over-content-collections.md`](../decisions/0006-provider-abstraction-over-content-collections.md).
