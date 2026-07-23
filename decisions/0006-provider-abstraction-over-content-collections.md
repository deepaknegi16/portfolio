# 0006 — Provider interface instead of Astro content collections

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** 1

## Context

The defining requirement of this project is that Phase 1 (JSON files) becomes Phase 3
(REST API) and Phase 4 (Postgres) **without rewriting the frontend**. Astro's idiomatic
answer for structured content is content collections, which are inherently filesystem- and
build-time-bound.

## Decision

All data access goes through one interface. No component or page ever reads a JSON file or
calls `fetch` directly.

```
src/lib/schema.ts            zod schemas — the contract
src/lib/providers/
  ├── types.ts               interface PortfolioDataSource {
  │                            getProfile(); getProjects(); getProject(slug);
  │                            getExperience(); getSkills();
  │                          }
  ├── static.ts              PHASE 1 — reads src/data/*.json, merges github-cache.json
  ├── api.ts                 PHASE 3 — fetches the FastAPI service
  └── index.ts               selects by PUBLIC_DATA_SOURCE ("static" | "api")
```

Every method is `async` from day one, even though the static implementation is synchronous
underneath — otherwise Phase 3 would change every call site's signature.

Both providers validate through the **same** zod schemas, so a malformed API response
fails in exactly the same place a malformed JSON file does.

Content collections are still appropriate for genuinely file-based content and may be used
if the blog backlog item is ever picked up. They are simply not used for portfolio data.

## Alternatives considered

- **Astro content collections for projects** — better DX for the file-based case (typed
  frontmatter, `getCollection()`), but it couples data loading to the filesystem. Phase 3
  would mean unpicking it from every page.
- **Astro 5 content layer with a custom API loader** — a genuine option, and closer to the
  framework grain. Rejected because the loader abstraction is Astro-specific and less
  obvious to read than a plain interface; the seam should be visible at a glance.
- **Direct JSON imports in components** — least code today, most rework later. This is the
  exact failure the project is designed to avoid.

## Consequences

- Phase 3 is genuinely: write `api.ts`, set one environment variable. Components untouched.
- Slight indirection cost in Phase 1 — reading a JSON file goes through an interface it
  doesn't strictly need.
- Async-from-day-one means some Astro components `await` data that is available
  synchronously. Harmless in Astro's build-time component model.
- The interface must stay narrow. Every method added is a method Phase 3 must implement.

## Revisit when

The provider interface starts accumulating methods that only one implementation can
support — a sign the abstraction is leaking and needs rethinking rather than extending.
