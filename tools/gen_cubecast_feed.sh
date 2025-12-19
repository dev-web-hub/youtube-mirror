#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/christianboullard/youtube-mirror/public/cubecast"
VIDDIR="$ROOT/videos"
THUMBDIR="$ROOT/thumbs"
OUT="$ROOT/feed.json"

cd "$VIDDIR"

mapfile -t vids < <(ls -1 *.mp4 2>/dev/null | LC_ALL=C sort)

if [ "${#vids[@]}" -lt 1 ]; then
  echo "[gen] no mp4 files found in $VIDDIR" >&2
  exit 1
fi

tmp="$(mktemp)"
{
  echo '{'
  echo '  "inject_after_swipes": 22,'
  echo '  "cta_url": "/hub/",'
  echo '  "cta_label": "Pick your lane → Hub",'
  echo '  "items": ['
  for i in "${!vids[@]}"; do
    f="${vids[$i]}"
    base="${f%.mp4}"
    poster=""
    if [ -f "$THUMBDIR/$base.jpg" ]; then
      poster="/cubecast/thumbs/$base.jpg"
    elif [ -f "$THUMBDIR/$base.png" ]; then
      poster="/cubecast/thumbs/$base.png"
    fi

    comma=","
    [ "$i" -eq "$((${#vids[@]}-1))" ] && comma=""

    label="$base"
    printf '    {"video":"%s","poster":"%s","label":"%s"}%s\n' \
      "/cubecast/videos/$f" \
      "$poster" \
      "$label" \
      "$comma"
  done
  echo '  ]'
  echo '}'
} > "$tmp"

mv "$tmp" "$OUT"
echo "[gen] wrote $OUT with ${#vids[@]} items"
