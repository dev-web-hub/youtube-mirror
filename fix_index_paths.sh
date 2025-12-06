#!/bin/bash

FILE="public/index.html"

# Backup
cp "$FILE" "$FILE.bak"

# Fix script paths
sed -i '' \
  -e 's|\.\./engine/|engine/|g' \
  -e 's|\.\./examples/|examples/|g' \
  "$FILE"

echo "Paths fixed in public/index.html"
echo "Backup at public/index.html.bak"
