#!/usr/bin/env bash
#
# PostToolUse hook (matcher: Write|Edit).
#
# Records a changed file path into a per-session queue. Deliberately does almost
# nothing: it runs after EVERY edit, so it must be a few milliseconds and must
# never block. The actual review happens once per turn in request-review.sh.
#
# Reads the hook payload on stdin. Always exits 0 — a bookkeeping hook must
# never be able to fail a turn.

set -uo pipefail

payload=$(cat)

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
review_dir="$project_dir/.claude/.review"

session=$(printf '%s' "$payload" | jq -r '.session_id // "unknown"' 2>/dev/null)
# Guard against a session_id containing path separators.
session="${session//\//_}"

file=$(printf '%s' "$payload" | jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null)

[ -z "$file" ] && exit 0

# Only queue things worth reviewing. Generated output, dependencies, and lock
# files change constantly and reviewing them is pure noise.
case "$file" in
  */node_modules/*|*/dist/*|*/.astro/*|*/.git/*|*/.claude/.review/*) exit 0 ;;
  *package-lock.json|*.lock|*.log) exit 0 ;;
esac

# Source files only. Docs and data are excluded on purpose: this repo's *.md
# decision records and TODO-laden *.json content would otherwise dominate every
# review. Add extensions here if that turns out to be too narrow.
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.astro|*.css|*.py|*.sh) ;;
  *Dockerfile|*docker-compose.yml|*.conf) ;;
  *) exit 0 ;;
esac

mkdir -p "$review_dir" 2>/dev/null || exit 0
queue="$review_dir/$session.queue"

# Dedup: the same file edited five times is still one file to review.
if [ -f "$queue" ] && grep -qxF "$file" "$queue" 2>/dev/null; then
  exit 0
fi

printf '%s\n' "$file" >> "$queue"
exit 0
