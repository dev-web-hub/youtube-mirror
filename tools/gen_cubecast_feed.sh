#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/christianboullard/youtube-mirror/public/cubecast"
VIDDIR="$ROOT/videos"
OUT="$ROOT/feed.json"

INJECT_AFTER_SWIPES="${INJECT_AFTER_SWIPES:-22}"
PAGE_SIZE="${PAGE_SIZE:-5}"
CTA_URL="${CTA_URL:-/hub/}"

cd "$VIDDIR"
mapfile -t files < <(ls -1 *.mp4 2>/dev/null | LC_ALL=C sort)

if [ "${#files[@]}" -lt 1 ]; then
  echo "[gen] no mp4 files found in $VIDDIR" >&2
  exit 1
fi

{
  echo '{'
  printf '  "inject_after_swipes": %s,\n' "$INJECT_AFTER_SWIPES"
  printf '  "page_size": %s,\n' "$PAGE_SIZE"
  printf '  "cta_url": "%s",\n' "$CTA_URL"
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
