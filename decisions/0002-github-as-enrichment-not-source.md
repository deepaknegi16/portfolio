# 0002 — Curated JSON is the source of truth; GitHub is enrichment

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** 1

## Context

The original ask was to showcase projects "from my GitHub". Inspecting
`api.github.com/users/deepaknegi16` on 2026-07-23 found:

- 7 public repos, no forks.
- `graph` (Java, "container graph data structure practice set", pushed 2024-07),
  `Eureka` (Java, 2021-11), `website` (2019-04), and `service_1` / `microservice` /
  `service` / `service-registry` (Java, Spring microservice practice, all 2018-07).
- Only 2 of 7 have a description. None have topics, stars, or a homepage.
- The user profile itself has no name, bio, company, or blog set.

Rendering that list verbatim would produce a portfolio that reads as sparse and eight
years stale — the opposite of the goal. Meanwhile the unauthenticated GitHub API allows
only 60 requests/hour per IP, which is a poor thing to depend on at page-load time.

## Decision

`frontend/src/data/projects.json`, hand-curated, is the source of truth for what appears
and how it is described. A build-time script (`scripts/fetch-github.mjs`) calls the GitHub
API once per build and writes `src/data/github-cache.json`, which the static provider
merges in to supply *live facts only*: language, topics, stars, forks, and last-pushed
date. Curated fields always win over fetched ones on conflict.

The generated cache file is **committed** so builds are reproducible offline, and the
fetch **fails soft** — a network error, rate-limit, or DNS failure logs a warning and
reuses the committed cache rather than breaking the build. This matters because the script
also runs inside `docker build`, where the network may be restricted.

Curated entries may describe private or work projects that have no GitHub repo at all;
those simply carry no `repoSlug` and get no enrichment.

## Alternatives considered

- **Live GitHub API from the browser** — always current and zero maintenance, but exposes
  the 60/hr unauthenticated rate limit to every visitor, slows first paint, and removes
  all editorial control over what's shown.
- **Curated JSON only, no fetch** — simplest, but stars/last-updated go stale silently,
  and one of the few genuinely dynamic signals on the page is lost.

## Consequences

- Full editorial control: weak repos can be omitted, strong work without a public repo can
  be included.
- Adding a project is a JSON edit plus a rebuild — acceptable, and exactly what the Phase 3
  backend later replaces.
- The curated blurbs must be written by the user; the initial scaffold ships visibly marked
  `TODO:` placeholders rather than invented descriptions.

## Addendum — 2026-07-23, after inspecting repo contents

Reading the actual file trees (not just the repo list) made the case stronger than the
metadata alone suggested. Of the 7 repos, **5 have no usable content**:

| Repo | Contents |
|---|---|
| `Eureka` | **Real.** Spring Boot + Maven project, `spring-cloud-starter-netflix-eureka-server` on Finchley.RELEASE, Java 8, Dockerfile on `openjdk:8` exposing port 8070 |
| `graph` | **Real, small.** Two files: `common/AdjacencyList.java`, `bfs/BfsTraversal.java` |
| `microservice` | README + `read.txt` + `readme.txt`, no code |
| `service` | README containing "Hello Deepak", no code |
| `website`, `service_1`, `service-registry` | **Empty** — no files at all |

So the scaffold ships **two** genuine project entries written from the code, plus two
clearly-marked placeholders (one with a `repo`, one without, to demonstrate both shapes).
The five empty repos are deliberately not listed: linking to an empty repository from a
portfolio is worse than not mentioning it.

## Revisit when

The GitHub profile becomes genuinely representative of current work, or Phase 4's database
takes over as the source of truth.
