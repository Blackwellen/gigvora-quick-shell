#!/usr/bin/env bash
# lighthouse-runner.sh — Lighthouse CI sweep on top routes (mobile preset).
# FD-18 G09 — emits docs/qa/evidence/G09-lighthouse/<route>.json
set -euo pipefail
BASE="${BASE:-http://localhost:5173}"
OUT="docs/qa/evidence/G09-lighthouse"
mkdir -p "$OUT"

ROUTES=("/" "/marketplace" "/jobs" "/services" "/projects" "/admin")

for route in "${ROUTES[@]}"; do
  slug=$(echo "$route" | sed 's@/@_@g; s@^_@root@')
  echo "→ Lighthouse $route"
  npx --yes lighthouse "$BASE$route" \
    --quiet --chrome-flags="--headless=new --no-sandbox" \
    --preset=mobile --output=json --output-path="$OUT/$slug.json" || true
done

echo "Done. Reports under $OUT/"
