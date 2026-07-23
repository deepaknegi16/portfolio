# Decisions

Every non-obvious choice in this project gets one file here. The point is **context
management**: a future session (human or AI) should be able to read this index plus the
relevant records and understand *why* the code looks the way it does — without
re-deriving it from the source or re-litigating settled questions.

## How to use

- One decision per file, named `NNNN-kebab-slug.md`, numbered sequentially. **Numbers are
  never reused or renumbered.**
- Copy [`TEMPLATE.md`](TEMPLATE.md) to start a new one.
- Decisions are **immutable once accepted**. If one turns out wrong, write a *new* record
  that supersedes it and flip the old one's status to `Superseded by NNNN`. Never rewrite
  history — the wrong turn is itself useful context.
- Record the decision when it's made, not when it's implemented.

## Index

| # | Decision | Status | Phase |
|---|---|---|---|
| [0001](0001-astro-typescript-frontend.md) | Astro + TypeScript for the frontend | Accepted | 1 |
| [0002](0002-github-as-enrichment-not-source.md) | Curated JSON is the source of truth; GitHub is enrichment | Accepted | 1 |
| [0003](0003-nginx-static-in-docker.md) | nginx serves prebuilt static output from a multi-stage image | Accepted | 2 |
| [0004](0004-ngrok-container-static-domain.md) | ngrok runs as a compose service with a static domain | Accepted | 2 |
| [0005](0005-fastapi-postgres-later-phases.md) | FastAPI + Postgres for phases 3–4, scoped to serving projects | Accepted | 3–4 |
| [0006](0006-provider-abstraction-over-content-collections.md) | Provider interface instead of Astro content collections | Accepted | 1 |
| [0007](0007-dark-terminal-design-system.md) | Dark terminal aesthetic, token-driven, no CDN assets | Accepted | 1 |
| [0008](0008-phase-boundaries.md) | Phase boundaries and what defines "done" for each | Accepted | all |
| [0009](0009-ngrok-free-tier-realities.md) | ngrok free tier: cloud endpoint conflict + browser interstitial | Accepted | 2 |
| [0010](0010-automated-code-review-hook.md) | Batched per-turn code review via Claude Code hooks | Accepted | tooling |
