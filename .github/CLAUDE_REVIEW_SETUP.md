# Claude Code review — one-time setup

`.github/workflows/claude-code-review.yml` reviews every pull request and posts
comments. It needs two things that only a repo admin can do. Until both are done
the workflow runs but fails immediately (it can't authenticate) — no PR is ever
blocked by it.

## 1. Install the Claude GitHub App

Go to **https://github.com/apps/claude** → **Install** → choose
`deepaknegi16/portfolio` (or "All repositories"). This lets the action act as
Claude on the repo.

## 2. Add the API key secret

Get a key from **https://console.anthropic.com/settings/keys**, then in the repo:

**Settings → Secrets and variables → Actions → New repository secret**

- **Name:** `ANTHROPIC_API_KEY`
- **Value:** your `sk-ant-…` key

This uses Anthropic API credits (separate from any Claude Code subscription).
A per-PR review is typically a few cents; cap it by lowering `--max-turns` in the
workflow.

## 3. Confirm it works

Once both are done, push any commit to a PR branch (or open a new PR). The
**Claude Code Review** check appears under the PR's "Checks" tab, and review
comments land within a minute or two. This PR (#7) that introduces the workflow
is *not* self-reviewed — GitHub runs `pull_request` workflows from the base
branch, so the workflow only becomes active after this PR merges to `main`.

## Tuning

- **Too chatty / too expensive:** lower `--max-turns` in the workflow.
- **Change what it flags:** edit the `prompt:` block — it mirrors the local
  reviewer rubric in [`../.claude/agents/code-reviewer.md`](../.claude/agents/code-reviewer.md).
- **Pause it:** disable the workflow under the repo's **Actions** tab.

## How this relates to the local reviewer

Two layers, same rubric:

| | Local hook (`.claude/`) | This workflow |
|---|---|---|
| Runs | after each turn, on your machine | on each PR, in GitHub Actions |
| Reviewer | `code-reviewer` subagent | `anthropics/claude-code-action` |
| Output | relayed in your terminal | PR review comments |
| Cost | your Claude Code session | Anthropic API credits |

The local hook catches things while you work; this catches things before merge,
including changes that never went through a local Claude session.
