#!/usr/bin/env bash
set -e

OUT="public/pages/local-sim"
mkdir -p "$OUT"

BRANDS=("deluxedeals" "mah" "maxtube" "cubecast")

for b in "${BRANDS[@]}"; do
  for n in $(seq 1 50); do
    id="${b}_${n}"
    cat > "$OUT/${id}.json" <<JSON
{
  "id": "$id",
  "brand": "$b",
  "blocks": [
    {
      "type": "hero",
      "title": "$b demo page $n",
      "subtitle": "Simulated layout for $b"
    },
    {
      "type": "video_player",
      "src": "https://example.com/video_${n}.mp4"
    },
    {
      "type": "product_grid",
      "heading": "Demo products for $b",
      "items": [
        { "title": "Item A", "price": "\$19" },
        { "title": "Item B", "price": "\$29" }
      ]
    },
    {
      "type": "cta_button",
      "label": "Continue",
      "href": "https://$b.example"
    }
  ]
}
JSON
  done
done

echo "Generated layouts into $OUT"
