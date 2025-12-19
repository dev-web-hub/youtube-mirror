#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/christianboullard/youtube-mirror/public/cubecast"
VIDDIR="$ROOT/videos"
THUMBDIR="$ROOT/thumbs"

missing=0
shopt -s nullglob

for v in "$VIDDIR"/*.mp4; do
  base="$(basename "$v" .mp4)"
  t="$THUMBDIR/$base.jpg"
  if [ ! -f "$t" ]; then
    echo "[missing-thumb] $t (for $(basename "$v"))" >&2
    missing=$((missing+1))
  fi
done

if [ "$missing" -gt 0 ]; then
  echo "[FAIL] missing thumbs: $missing" >&2
  exit 1
fi

echo "[ok] thumbs present for all videos"
