#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(pwd)"
PAGES_DIR="$REPO_ROOT/public/pages"
OUT="$REPO_ROOT/cloudflare_redirects.ndjson"

ENGINE_DOMAIN="mah-relay.win"

declare -A BRANDS=(
  ["dd"]="deluxedeals.net"
  ["mah"]="marketaffiliatehelp.com"
  ["mt"]="maxtube.app"
  ["cc"]="cubecast.app"
)

echo "Generating Cloudflare NDJSON redirects..."
echo "Repo root: $REPO_ROOT"
echo "Output NDJSON: $OUT"
echo ""

: > "$OUT"  # truncate

gen_for_brand() {
  local prefix="$1"
  local domain="$2"
  local dir="$PAGES_DIR/${prefix}_prod"

  echo "→ Brand '$prefix' (${domain}) from $dir"

  if [[ ! -d "$dir" ]]; then
    echo "   SKIP: directory missing."
    return
  fi

  local count
  count=$(find "$dir" -type f -name "${prefix}_*.json" | wc -l | tr -d ' ')
  if [[ "$count" == "0" ]]; then
    echo "   SKIP: no ${prefix}_*.json files."
    return
  fi

  echo "   Found $count pages, emitting NDJSON..."

  find "$dir" -type f -name "${prefix}_*.json" | sort | while read -r file; do
    base="$(basename "$file" .json)"
    id="${base#${prefix}_}"

    src="https://${domain}/offer/${id}"
    tgt="https://${ENGINE_DOMAIN}/${prefix}/${id}"

    printf '{"source_url":"%s","target_url":"%s","status_code":301,"preserve_query_string":false}\n' \
      "$src" "$tgt" >> "$OUT"
  done

  echo "   DONE $prefix"
  echo ""
}

for prefix in "${!BRANDS[@]}"; do
  gen_for_brand "$prefix" "${BRANDS[$prefix]}"
done

TOTAL=$(wc -l < "$OUT" | tr -d ' ')
echo "--------------------------------------"
echo "NDJSON generation complete."
echo "Total redirect entries: $TOTAL"
echo "Saved to: $OUT"
echo "--------------------------------------"
