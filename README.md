# Portfolio

Personal portfolio site. Astro static frontend, served by nginx in Docker, exposed
publicly through an ngrok tunnel. Built in phases so a FastAPI backend and Postgres can be
added later without rewriting the frontend.

- **What to do next:** [`tasks.md`](tasks.md)
- **Why things are the way they are:** [`decisions/`](decisions/README.md)

## Quickstart

```bash
cp .env.example .env      # fill in ngrok values before Phase 2

cd frontend
npm install
npm run dev               # → http://localhost:4321
```

Full stack in containers (Phase 2 onward):

```bash
docker compose up --build     # site → http://localhost:8080
                              # public → https://$NGROK_DOMAIN
                              # ngrok inspector → http://localhost:4040
```

## Layout

| Path | What it is |
|---|---|
| `frontend/` | Astro site — the whole of Phase 1 |
| `frontend/src/data/` | Curated content (`projects.json`, `profile.json`, …) — **edit here to change the site** |
| `frontend/src/lib/providers/` | The data seam that lets Phase 3 swap JSON for an API |
| `frontend/nginx/` | nginx config used by the container |
| `contracts/` | OpenAPI sketch the Phase 3 backend implements |
| `backend/` | FastAPI service — Phase 3 |
| `decisions/` | One file per decision, with the reasoning |
| `.claude/` | Project agents + hooks: automatic code review of each turn's changes |

## Editing content

Everything visible on the site comes from `frontend/src/data/*.json`, validated against the
zod schemas in `frontend/src/lib/schema.ts`. A bad edit fails the build with a precise
message rather than rendering something broken.

Live GitHub stats (stars, language, last push) are merged in at build time by
`frontend/scripts/fetch-github.mjs`. Curated fields always win. If GitHub is unreachable
the build still succeeds using the committed `src/data/github-cache.json`.

## Ports

| Port | Service |
|---|---|
| 4321 | Astro dev server (local only) |
| 8080 | nginx in Docker |
| 4040 | ngrok request inspector |
| 8000 | FastAPI (Phase 3) |
| 5432 | Postgres (Phase 4) |

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 0 | Toolchain + scaffold | Done |
| 1 | Astro static site | In progress |
| 2 | Docker + nginx + ngrok | Not started |
| 3 | FastAPI backend | Not started |
| 4 | Postgres | Not started |
