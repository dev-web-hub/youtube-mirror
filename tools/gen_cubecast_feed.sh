#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/christianboullard/youtube-mirror/public/cubecast"
VIDDIR="$ROOT/videos"
OUT="$ROOT/feed.json"

# Ensure paths exist
[ -d "$VIDDIR" ] || {
  echo "[feed] video dir missing: $VIDDIR" >&2
  exit 1
}

cd "$VIDDIR"

# Deterministic ordering (critical for UX muscle memory)
# Filenames already encode sequence → lexicographic sort is correct
mapfile -t files < <(ls -1 *.mp4 2>/dev/null | LC_ALL=C sort)

if [ "${#files[@]}" -eq 0 ]; then
  echo "[feed] no .mp4 files found in $VIDDIR" >&2
  exit 1
fi

TMP="$(mktemp)"

{
  echo '{'
  echo '  "inject_after_swipes": 22,'
  echo '  "cta_url": "/plp/en/automation-roadmap/",'
  echo '  "videos": ['

  for i in "${!files[@]}"; do
    f="${files[$i]}"
    comma=","
    [ "$i" -eq "$((${#files[@]} - 1))" ] && comma=""
    printf '    "%s"%s\n' "/cubecast/videos/$f" "$comma"
  done

  echo '  ]'
  echo '}'
} > "$TMP"

# Atomic write (prevents half-written feed.json during refresh)
mv "$TMP" "$OUT"

echo "[feed] OK → $(basename "$OUT") (${#files[@]} videos)"
