#!/bin/bash

SLUG="$1"
BASE=~/youtube-mirror/public
PROD_DIR="$BASE/products/$SLUG"
TEMPLATE="$BASE/products/_template/template.html"
OUT_HTML="$PROD_DIR/index.html"
PROD_JSON="$PROD_DIR/product.json"

TITLE=$(jq -r .title "$PROD_JSON")
BADGE=$(jq -r .badge "$PROD_JSON")
DESCRIPTION=$(jq -r .description "$PROD_JSON")
CTA=$(jq -r .cta "$PROD_JSON")
VARIANT=$(jq -r .variant "$PROD_JSON")
MOOD=$(jq -r .mood "$PROD_JSON")
CA_LINK=$(jq -r .ca_link "$PROD_JSON")
US_LINK=$(jq -r .us_link "$PROD_JSON")

MOOD_CLASS="mood-$MOOD"

sed \
  -e "s|{{TITLE}}|$TITLE|g" \
  -e "s|{{BADGE}}|$BADGE|g" \
  -e "s|{{DESCRIPTION}}|$DESCRIPTION|g" \
  -e "s|{{CTA}}|$CTA|g" \
  -e "s|{{VARIANT}}|$VARIANT|g" \
  -e "s|{{MOOD_CLASS}}|$MOOD_CLASS|g" \
  -e "s|{{CA_LINK}}|$CA_LINK|g" \
  -e "s|{{US_LINK}}|$US_LINK|g" \
  "$TEMPLATE" > "$OUT_HTML"

echo "✅ PRODUCT PAGE UPDATED:"
echo "👉 $OUT_HTML"
