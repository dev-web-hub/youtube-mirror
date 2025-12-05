#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

DD_DIR="$ROOT/public/pages/prod"
MAH_DIR="$ROOT/public/pages/mah_prod"
MT_DIR="$ROOT/public/pages/mt_prod"
CC_DIR="$ROOT/public/pages/cc_prod"

OUT="$ROOT/cloudflare_redirects.csv"

echo "Writing Cloudflare redirects to: $OUT"

# CSV header (Cloudflare bulk redirect format)
echo "Source,Target,Status" > "$OUT"

generate_redirects() {
  local DIR="$1"
  local PREFIX="$2"
  local DOMAIN="$3"

  if find "$DIR" -maxdepth 1 -type f -name "${PREFIX}_*.json" | grep -q .; then
    echo "→ Processing $PREFIX pages in $DIR"
    find "$DIR" -maxdepth 1 -type f -name "${PREFIX}_*.json" |
    while read -r file; do
      base="$(basename "$file" .json)"
      id="${base#${PREFIX}_}"
      echo "/${PREFIX}/${id},https://${DOMAIN}/offer/${id},301" >> "$OUT"
    done
  else
    echo "WARN: No ${PREFIX}_*.json found in $DIR"
  fi
}

generate_redirects "$DD_DIR"  "dd"  "deluxedeals.net"
generate_redirects "$MAH_DIR" "mah" "mah-relay.win"
generate_redirects "$MT_DIR"  "mt"  "maxtube.app"
generate_redirects "$CC_DIR"  "cc"  "cubecast.app"

COUNT=$(( $(wc -l < "$OUT") - 1 ))
echo "Done. Wrote $COUNT redirect rows to $OUT"
