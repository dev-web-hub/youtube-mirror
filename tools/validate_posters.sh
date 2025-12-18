#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/christianboullard/youtube-mirror/public/cubecast"
VID="$ROOT/videos"
THUMB="$ROOT/thumbs"

fail=0

for v in "$VID"/*.mp4; do
  b="$(basename "$v" .mp4)"
  t="$THUMB/$b.jpg"
  if [ ! -f "$t" ]; then
    echo "[missing] $t"
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "[FAIL] poster validation failed"
  exit 1
fi

echo "[ok] all posters present"
