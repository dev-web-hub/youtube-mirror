#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TPL="${ROOT}/products/_template/template.html"

[[ -f "$TPL" ]] || { echo "[ERR] missing template: $TPL"; exit 1; }

count=0
while IFS= read -r -d '' layout; do
  dir="$(dirname "$layout")"
  out="${dir}/index.html"
  "${ROOT}/tools/render_product.py" "$TPL" "$layout" "$out"
  count=$((count+1))
done < <(find "${ROOT}/products" -name "*.layout.json" -print0)

echo "[OK] Built ${count} product pages."
