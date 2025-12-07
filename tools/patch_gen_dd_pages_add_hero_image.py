#!/usr/bin/env python3
import re
import sys

TARGET = "tools/gen_dd_pages_multilang.py"

with open(TARGET, "r") as f:
    text = f.read()

# Replace blocks definition to include hero_image
patched = re.sub(
    r'("blocks": \[\s*{\s*"type": "hero",)',
    r'\1\n            "image": product.get("image"),',
    text,
    flags=re.MULTILINE
)

with open(TARGET, "w") as f:
    f.write(patched)

print("✅ Patched gen_dd_pages_multilang.py to include hero_image.")
