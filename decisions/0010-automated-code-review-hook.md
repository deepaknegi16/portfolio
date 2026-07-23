# 0010 — Batched per-turn code review via Claude Code hooks

- **Status:** Accepted
- **Date:** 2026-07-23
- **Phase:** tooling (applies to all phases)

## Context

Every file change should get reviewed by a subagent. The naive implementation — fire a
review agent from a `PostToolUse` hook on every `Write`/`Edit` — has two problems that
only show up at real usage volume:

- **Volume.** Building Phase 0–2 took roughly 60 file writes in a single session. That
  would have been 60 review agents.
- **Agent hooks block.** The `agent` hook type runs synchronously and has no `async`
  option (unlike `command` hooks). Every edit would pause the turn for a full review.
- **Isolated files review badly.** A helper added in one file and used in another is one
  change. Reviewing either half alone generates confident, wrong findings.

`FileChanged` is a real hook event in the settings schema, but the `agent` hook type is
only available on tool events (`PreToolUse`, `PostToolUse`, `PermissionRequest`), and
`.claude/agents/*.md` subagents are invoked through the Agent tool rather than named
directly by a hook. So the trigger and the reviewer have to be connected indirectly.

## Decision

Three cheap hooks that batch the work into **one review per user turn**:

| Hook | Event | Does |
|---|---|---|
| `queue-changed-file.sh` | `PostToolUse` (`Write\|Edit`), `async` | Appends the changed path to a per-session queue. Filters to source extensions, skips `dist/`, `node_modules/`, `.astro/`, lock files. Dedups. Milliseconds; never blocks. |
| `request-review.sh` | `Stop` | If the queue is non-empty, returns `decision: "block"` asking Claude to run the `code-reviewer` subagent over the whole batch. |
| `reset-review-flag.sh` | `UserPromptSubmit` | Clears the once-per-turn flag; prunes state older than a day. |

The reviewer itself is `.claude/agents/code-reviewer.md` — a normal project subagent, so it
is also invocable by hand. It has **no edit tools on purpose**: its output is a report, and
a reviewer that can rewrite the code it is judging is not a reviewer.

Findings are **advisory**. They are relayed to the user, not enforced. A false positive
should cost a sentence, not a blocked turn.

### Loop safety

A `Stop` hook returning `decision: "block"` makes Claude keep working. If the review then
causes edits, those edits re-queue and `Stop` fires again — an infinite loop. Two
independent guards prevent it, and both were tested:

1. The queue is **cleared before** the request is emitted, so a batch can never be
   requested twice.
2. A `.reviewed` flag is written, and **only** `UserPromptSubmit` removes it. At most one
   review per user turn regardless of how many edit/stop cycles happen inside it.

Verified by piping synthetic payloads: second `Stop` is silent; edits *after* a review
still produce a silent `Stop`; a simulated new user turn fires again; an empty queue exits
silently so normal turns end normally.

## Alternatives considered

- **`agent` hook on every `PostToolUse`** — literally "review every change", but blocking
  and ~60× the cost per session, on isolated file snapshots.
- **Async command hook per edit, findings to a log** — cheapest, never blocks, but findings
  land in a file nobody remembers to read.
- **Blocking on findings** — a stronger guarantee, rejected because a nitpicky or wrong
  finding stalls real work, and stop-hook loops are an unforgiving failure mode.

## Consequences

- Roughly one review per turn instead of one per edit, over a coherent change set.
- The reviewer sees only files matching the extension filter in `queue-changed-file.sh`.
  Markdown and JSON are excluded deliberately — this repo's decision records and
  `TODO:`-laden data files would otherwise dominate every review. Widen the filter there
  if that proves too narrow.
- `.claude/.review/` holds runtime state and is gitignored; the hooks and agent definition
  are tracked so the behaviour travels with the repo.
- **Hooks only load if `.claude/` existed when the session started.** After first adding
  them, open `/hooks` once or restart Claude Code, or they silently do nothing.

## Revisit when

Reviews start feeling like noise (tighten the rubric in `code-reviewer.md`), or a real
defect slips through a filter (widen `queue-changed-file.sh`).
