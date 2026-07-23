# Tasks

Task tracker for the portfolio website. Grouped by phase, with stable IDs (`P1-04`) that
never get renumbered — decisions and commits reference them.

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked (reason inline)

> **Current focus:** Phase 2 — the container stack is verified locally at
> http://localhost:8080. The public tunnel is blocked on P2-08 (delete the ngrok
> Cloud Endpoint), which only you can do.

---

## Phase 0 — Prerequisites & scaffold

- [x] **P0-01** `git init` and create top-level directory skeleton
- [x] **P0-02** Create `tasks.md` (this file)
- [x] **P0-03** Create `decisions/` with README, template, and ADRs 0001–0008
- [x] **P0-04** Create `.gitignore` and `.env.example`
- [x] **P0-05** Create root `README.md` with quickstart
- [x] **P0-06** Install Node (`brew install node` → v26.5.0; Homebrew ships current, not 22 LTS)
- [x] **P0-07** Docker Desktop installed and launched — Docker 29.6.2, Compose v5.3.1
- [x] **P0-08** ngrok authtoken set in `.env`; the free account came with the static domain
      `polo-countdown-frolic.ngrok-free.dev` already assigned (see P2-08)

## Phase 1 — Astro static site

- [x] **P1-01** Scaffold Astro + TypeScript (strict) in `frontend/` — Astro 7.1.3
- [x] **P1-02** Design tokens: dark terminal palette, type scale, spacing (`src/styles/tokens.css`)
- [x] **P1-03** Global styles + self-hosted JetBrains Mono via `@fontsource-variable`
- [x] **P1-04** `src/lib/schema.ts` — zod schemas for Profile, Project, Experience, Skill
- [x] **P1-05** `src/lib/providers/` — interface, static provider, selector (the phase-swap seam)
- [x] **P1-06** `scripts/fetch-github.mjs` — build-time enrichment, fails soft, `prebuild` hook
- [x] **P1-07** Seed `src/data/*.json` — 2 real repos written up, 2 marked placeholders
- [x] **P1-08** `BaseLayout.astro` — SEO/OG meta, no-flash theme script
- [x] **P1-09** Components: Nav, Hero, About, Footer
- [x] **P1-10** Components: ProjectCard, ProjectGrid, TechChip + stack filter
- [x] **P1-11** Components: SkillsGrid, ExperienceTimeline
- [x] **P1-12** `pages/index.astro` — anchored single-page composition
- [x] **P1-13** `pages/projects/[slug].astro` — generated detail pages
- [x] **P1-14** Themed `404.astro`
- [x] **P1-15** Theme toggle (vanilla TS, localStorage-backed)
- [x] **P1-16** Responsive pass down to 360px + `prefers-reduced-motion`
- [x] **P1-17** `contracts/openapi.yaml` — API contract sketch for Phase 3
- [~] **P1-18** Verify — done: `astro build` clean (6 pages), `astro check` 0 errors,
      fail-soft GitHub fetch confirmed (404 → stale cache reused, build still passed).
      **Outstanding:** Lighthouse run and a human look at the design — no browser
      tooling available in this session.

## Phase 2 — Docker + nginx + ngrok

- [x] **P2-01** `frontend/Dockerfile` — multi-stage node build → nginx serve
- [x] **P2-02** `frontend/.dockerignore`
- [x] **P2-03** `frontend/nginx/default.conf` — gzip, cache policy, security headers, `/healthz`,
      commented `/api/` proxy block for Phase 3
- [x] **P2-04** `docker-compose.yml` — `web` + `ngrok` services
- [x] **P2-05** Optional `dev` compose profile (bind-mounted Astro dev server)
- [~] **P2-06** Verify — **local half done.** Image builds; container reports `healthy` in 3s;
      `/healthz` → 200; `/` → 200; `/projects/<slug>/` → 200; bare slug → 301 to canonical;
      unknown path → 404; `/.env` → 403; security headers present on *both* HTML and
      `/_astro/` assets; HTML `max-age=0, must-revalidate` vs assets `immutable`;
      gzip 20,212 → 4,595 bytes.
      **Outstanding:** ngrok tunnel + reaching the public URL from cellular — blocked on
      `NGROK_DOMAIN` being empty in `.env`.
- [x] **P2-07** ngrok behaviour observed and recorded in `decisions/0009` — interstitial is
      real (ERR_NGROK_6024), and the free static domain is pre-occupied by an
      auto-provisioned Cloud Endpoint
- [!] **P2-08** Delete the auto-provisioned Cloud Endpoint at
      https://dashboard.ngrok.com/endpoints so the agent tunnel can bind the domain —
      *account action, only you can do it*
- [ ] **P2-09** Set `NGROK_DOMAIN=polo-countdown-frolic.ngrok-free.dev` in `.env` and update
      `seo.siteUrl` in `frontend/src/data/profile.json` to match

## Phase 3 — FastAPI backend

- [ ] **P3-01** `backend/` FastAPI app + Pydantic models mirroring `schema.ts`
- [ ] **P3-02** Implement `contracts/openapi.yaml` routes (JSON-file backed at this stage)
- [ ] **P3-03** `src/lib/providers/api.ts`
- [ ] **P3-04** Uncomment nginx `/api/` proxy; add `api` service to compose
- [ ] **P3-05** Verify: identical rendered output under `PUBLIC_DATA_SOURCE=api`

## Phase 4 — Postgres

- [ ] **P4-01** `db` service (`postgres:17-alpine`) + named volume
- [ ] **P4-02** SQLAlchemy models + Alembic migrations
- [ ] **P4-03** Seed command: JSON → DB
- [ ] **P4-04** Repository layer behind the existing routes
- [ ] **P4-05** Verify: data survives `down`/`up`, API output unchanged

---

## Backlog (out of scope — not scheduled)

- Admin CRUD UI + JWT auth
- Blog / writeups
- Self-hosted page-view analytics
- CI pipeline
- Real hosting beyond ngrok
- Contact form
- Resume download
