#!/usr/bin/env bash
#
# UserPromptSubmit hook.
#
# Clears the once-per-turn review flag so the next user turn gets its own
# review. This is the ONLY thing that resets it — see request-review.sh for why
# that matters (it is what makes the Stop hook loop-proof).
#
# Also prunes stale queue/flag files from sessions that ended without a Stop, so
# .claude/.review/ does not accumulate indefinitely.

set -uo pipefail

payload=$(cat)

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
review_dir="$project_dir/.claude/.review"

[ -d "$review_dir" ] || exit 0

session=$(printf '%s' "$payload" | jq -r '.session_id // "unknown"' 2>/dev/null)
session="${session//\//_}"

rm -f "$review_dir/$session.reviewed"

# Anything untouched for a day belongs to a session that is long gone.
find "$review_dir" -type f -mtime +1 -delete 2>/dev/null || true

exit 0
