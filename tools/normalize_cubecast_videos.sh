#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/christianboullard/youtube-mirror/public/cubecast"
VIDDIR="$ROOT/videos"
THUMBDIR="$ROOT/thumbs"

mkdir -p "$THUMBDIR"
cd "$VIDDIR"

shopt -s nullglob

for f in *.mp4; do
  [[ "$f" =~ game-([0-9]+) ]] || continue

  raw_game="${BASH_REMATCH[1]}"
  game_num=$((10#$raw_game))
  game=$(printf "%02d" "$game_num")

  seg="01"
  [[ "$f" =~ seg-([0-9]+) ]] && seg=$(printf "%02d" "$((10#${BASH_REMATCH[1]}))")

  dur="unknown"
  [[ "$f" =~ ([0-9]+\.[0-9]+)s ]] && dur="${BASH_REMATCH[1]}"

  new="game-${game}_seg-${seg}_9x16_${dur}s_base.mp4"

  if [[ "$f" != "$new" ]]; then
    echo "[rename] $f -> $new"
    mv -n "$f" "$new"
  fi

  poster="$THUMBDIR/${new%.mp4}.jpg"
  if [[ ! -f "$poster" ]]; then
    ffmpeg -loglevel error -y -i "$new" \
      -vf "select=eq(n\,0),scale=540:960" \
      -vframes 1 "$poster"
    echo "[poster] $poster"
  fi
done

echo "[ok] normalization + posters complete"
