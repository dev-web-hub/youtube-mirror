#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$ROOT/public/pages/prod"
mkdir -p "$ROOT/public/pages/mah_prod"
mkdir -p "$ROOT/public/pages/mt_prod"
mkdir -p "$ROOT/public/pages/cc_prod"

echo "Generating small sample page batches..."

generate_batch() {
  local DIR="$1"
  local PREFIX="$2"
  local BRAND="$3"

  mkdir -p "$DIR"

  for id in $(seq 1 10); do
    cat <<JSON > "$DIR/${PREFIX}_${id}.json"
{
  "id": "${PREFIX}_${id}",
  "brand": "${BRAND}",
  "blocks": [
    { "type": "hero", "title": "${BRAND} Page ${id}", "subtitle": "Sample auto-generated page" },
    { "type": "product_grid", "heading": "Featured", "items": [
      { "title": "Item A", "price": "$10" },
      { "title": "Item B", "price": "$20" }
    ]},
    { "type": "cta_button", "label": "Visit", "href": "https://${BRAND}/offer/${id}" }
  ]
}
JSON
  done

  echo "→ Created 10 test pages in: $DIR"
}

generate_batch "$ROOT/public/pages/prod"      "dd"  "deluxedeals.net"
generate_batch "$ROOT/public/pages/mah_prod"  "mah" "mah-relay.win"
generate_batch "$ROOT/public/pages/mt_prod"   "mt"  "maxtube.app"
generate_batch "$ROOT/public/pages/cc_prod"   "cc"  "cubecast.app"

echo "Sample batch generation complete."
