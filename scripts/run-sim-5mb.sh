#!/usr/bin/env bash
set -e

TARGET_MB=5
OUT="public/pages/local-sim"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "Simulating until folder reaches ${TARGET_MB}MB…"

while true; do
  scripts/gen-local-layouts.sh

  size=$(du -sm "$OUT" | awk '{print $1}')
  echo "Current: ${size}MB"

  if [ "$size" -ge "$TARGET_MB" ]; then
    echo "Reached ${TARGET_MB}MB. Stopping."
    break
  fi
done
