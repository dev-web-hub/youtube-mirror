#!/usr/bin/env bash
set -euo pipefail

# --------------------------------------
# Elegant Cloudflare Redirect Generator
# --------------------------------------

# Must be run from repo root
REPO_ROOT="$(pwd)"

PAGES_DIR="$REPO_ROOT/public/pages"
OUT="$REPO_ROOT/cloudflare_redirects.csv"

declare -A BRANDS=(
  ["dd"]="deluxedeals.net"
  ["mah"]="marketaffiliatehelp.com"
  ["mt"]="maxtube.app"
  ["cc"]="cubecast.app"
)

echo "Generating Cloudflare redirects..."
echo "Repo root: $REPO_ROOT"
echo "Output CSV: $OUT"
echo ""

# Write CSV header
echo "Source,Target,Status" > "$OUT"

# Function: process a brand directory
process_brand() {
  local prefix="$1"
  local domain="$2"
  local dir="$PAGES_DIR/${prefix}_prod"

  echo "→ Processing brand '$prefix' in: $dir"

  if [[ ! -d "$dir" ]]; then
    echo "   SKIP: directory does not exist."
    return
  fi

  local count
  count=$(find "$dir" -type f -name "${prefix}_*.json" | wc -l | tr -d ' ')
  if [[ "$count" == "0" ]]; then
    echo "   SKIP: no matching ${prefix}_*.json files."
    return
  fi

  echo "   Found $count JSON pages. Writing redirects..."

  find "$dir" -type f -name "${prefix}_*.json" | sort | while read -r file; do
    base="$(basename "$file" .json)"
    id="${base#${prefix}_}"

    echo "/${prefix}/${id},https://${domain}/offer/${id},301" >> "$OUT"
  done

  echo "   DONE brand '$prefix'"
  echo ""
}

# Process each brand
for prefix in "${!BRANDS[@]}"; do
  process_brand "$prefix" "${BRANDS[$prefix]}"
done

# Count output rows
TOTAL=$(( $(wc -l < "$OUT") - 1 ))
echo "--------------------------------------"
echo "Redirect generation complete."
echo "Total redirects written: $TOTAL"
echo "Saved to: $OUT"
echo "--------------------------------------"
