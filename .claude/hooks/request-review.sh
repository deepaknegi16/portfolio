#!/usr/bin/env bash
#
# Stop hook.
#
# If files were changed during this turn, ask Claude to review them with the
# code-reviewer subagent before the turn ends.
#
# LOOP SAFETY — the important part. A Stop hook that returns decision:"block"
# makes Claude keep working, and if the review itself causes edits, those edits
# re-queue and Stop fires again. Two independent guards prevent that:
#
#   1. The queue is cleared BEFORE emitting the request, so the same batch can
#      never be requested twice.
#   2. A `.reviewed` flag is written, and only reset-review-flag.sh (on
#      UserPromptSubmit) removes it. So at most ONE review happens per user
#      turn, no matter how many edit/stop cycles occur inside it.
#
# Exits 0 with no output when there is nothing to do, which lets the turn end
# normally.

set -uo pipefail

payload=$(cat)

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
review_dir="$project_dir/.claude/.review"

session=$(printf '%s' "$payload" | jq -r '.session_id // "unknown"' 2>/dev/null)
session="${session//\//_}"

queue="$review_dir/$session.queue"
flag="$review_dir/$session.reviewed"

# Guard 2: already reviewed once this user turn.
[ -f "$flag" ] && exit 0

# Nothing changed.
[ ! -s "$queue" ] && exit 0

files=$(cat "$queue")
count=$(printf '%s\n' "$files" | grep -c . || true)

# Guard 1: clear the batch before requesting it.
rm -f "$queue"
: > "$flag"

# Paths relative to the project root read better in the request.
rel_files=$(printf '%s\n' "$files" | sed "s|^$project_dir/||" | sed 's/^/  - /')

reason="Before finishing: ${count} source file(s) changed this turn. Launch the \
\`code-reviewer\` subagent (Agent tool, subagent_type: \"code-reviewer\") to review them \
as one change set, passing this list:

${rel_files}

Then relay any real findings to the user in your final message, most severe first. If the \
reviewer reports no issues, say so in one short line and stop — do not pad it. Do not fix \
anything unless the user asks or a finding is critical. This review has already been \
recorded; it will not be requested again this turn."

jq -n --arg reason "$reason" --argjson n "$count" \
  '{decision:"block", reason:$reason, systemMessage:("Code review queued for \($n) changed file(s)")}'

exit 0
