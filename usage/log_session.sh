#!/usr/bin/env bash
# Logs a Claude Code session and pushes updated stats to GitHub.
# Usage: log_session.sh <start_iso8601> <end_iso8601>
# If called with no args, uses current time as end and reads START_TIME env var.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA_FILE="$REPO_DIR/usage/sessions.json"
GOAL_MINUTES="${MONTHLY_GOAL_MINUTES:-600}"

END_TIME="${2:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
START_TIME="${1:-${SESSION_START_TIME:-}}"

if [[ -z "$START_TIME" ]]; then
  echo "Error: START_TIME not provided" >&2
  exit 1
fi

# Calculate duration in minutes
start_epoch=$(date -d "$START_TIME" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$START_TIME" +%s)
end_epoch=$(date -d "$END_TIME" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$END_TIME" +%s)
duration_minutes=$(( (end_epoch - start_epoch) / 60 ))

# Minimum 1 minute per session
[[ $duration_minutes -lt 1 ]] && duration_minutes=1

TODAY=$(date -u +%Y-%m-%d)
WEEK_START=$(date -u -d "last monday" +%Y-%m-%d 2>/dev/null || date -u +%Y-%m-%d)
MONTH=$(date -u +%Y-%m)

python3 - <<PYEOF
import json, sys
from datetime import datetime, timezone

data_file = "$DATA_FILE"
start = "$START_TIME"
end = "$END_TIME"
dur = $duration_minutes
today = "$TODAY"
week_start = "$WEEK_START"
month = "$MONTH"
goal = $GOAL_MINUTES

with open(data_file) as f:
    data = json.load(f)

# Append session
data["sessions"].append({
    "start": start,
    "end": end,
    "minutes": dur
})

# Keep only last 90 days of raw sessions
recent = [s for s in data["sessions"]
          if s["start"] >= month[:4] + "-01-01"]
data["sessions"] = recent[-500:]

# Recalculate stats
all_sessions = data["sessions"]
today_sessions = [s for s in all_sessions if s["start"].startswith(today)]
week_sessions  = [s for s in all_sessions if s["start"][:10] >= week_start]
month_sessions = [s for s in all_sessions if s["start"].startswith(month)]

data["stats"] = {
    "total_sessions":       len(all_sessions),
    "total_minutes":        sum(s["minutes"] for s in all_sessions),
    "today_sessions":       len(today_sessions),
    "today_minutes":        sum(s["minutes"] for s in today_sessions),
    "week_sessions":        len(week_sessions),
    "week_minutes":         sum(s["minutes"] for s in week_sessions),
    "month_sessions":       len(month_sessions),
    "month_minutes":        sum(s["minutes"] for s in month_sessions),
    "monthly_goal_minutes": goal,
    "last_updated":         end
}

with open(data_file, "w") as f:
    json.dump(data, f, indent=2)

print(f"Logged {dur}m session. Month: {data['stats']['month_minutes']}m / {goal}m")
PYEOF

# Commit and push
cd "$REPO_DIR"
git add usage/sessions.json
git commit -m "usage: log session $(date -u +%Y-%m-%d) +${duration_minutes}m" --no-gpg-sign 2>/dev/null || true

for attempt in 1 2 3 4; do
  if git push -u origin HEAD 2>/dev/null; then
    echo "Pushed to GitHub"
    break
  fi
  sleep $((2 ** attempt))
done
