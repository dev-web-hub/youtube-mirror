#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/christianboullard/youtube-mirror/public/cubecast"
VIDDIR="$ROOT/videos"
OUT="$ROOT/feed.json"

cd "$VIDDIR"

# macOS sort is fine; keep lexicographic order (your filenames are already structured).
mapfile -t files < <(ls -1 *.mp4 2>/dev/null | LC_ALL=C sort)

if [ "${#files[@]}" -lt 1 ]; then
  echo "[gen] no mp4 files found in $VIDDIR" >&2
  exit 1
fi

{
  echo '{'
  echo '  "inject_after_swipes": 22,'
  echo '  "cta_url": "/products/xreal-one/",'
  echo '  "videos": ['
  for i in "${!files[@]}"; do
    f="${files[$i]}"
    comma=","
    [ "$i" -eq "$((${#files[@]}-1))" ] && comma=""
    printf '    "%s"%s\n' "/cubecast/videos/$f" "$comma"
  done
  echo '  ]'
  echo '}'
} > "$OUT"

echo "[gen] wrote $OUT with ${#files[@]} videos"