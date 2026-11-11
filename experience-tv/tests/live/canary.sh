#!/usr/bin/env bash
# Ecwid canary: runs every READ-ONLY check against the PUBLIC live product page and prints one line per check.
# Local browser only; nothing is saved in the store; Add to Bag is never clicked. Run before every release and about weekly:
# Ecwid changes its storefront code without notice, and this is the earliest warning that something in our layer no longer fits.
#   bash tests/live/canary.sh [output-dir]        (needs: node tools/build-embed.mjs first; ffmpeg for restore-e2)
set -u
cd "$(dirname "$0")/../.."
export NODE_PATH="$(npm root -g)"
OUT="${1:-/tmp/ecwid-canary}"; mkdir -p "$OUT"; : > "$OUT/summary.txt"
run() { name=$1; shift; timeout 600 "$@" > "$OUT/$name.log" 2>&1; code=$?; echo "$name exit=$code | $(tail -1 "$OUT/$name.log" | cut -c1-150)" | tee -a "$OUT/summary.txt"; }
run options-probe   node tests/live/options-probe.cjs iphone "$OUT/options.json"
run sync-fast       node tests/live/sync-poc.cjs fast "$OUT/sync-fast.json"
run sync-slow       node tests/live/sync-poc.cjs slow "$OUT/sync-slow.json"
run size-prices     node tests/live/size-prices-e2.cjs "$OUT/size.json"
run specialist-url  node tests/live/specialist-url-check.cjs "$OUT/specialist.json"
run events          node tests/live/events.cjs
run errors-addtobag node tests/live/errors-and-addtobag.cjs
run gallery         node tests/live/gallery-e2.cjs
run restore         node tests/live/restore-e2.cjs
run structured-data node tests/live/structured-data-probe.cjs
echo "details in $OUT"
