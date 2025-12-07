#!/usr/bin/env python3
import json
import os
from urllib.parse import urlparse

INPUT_JSON = "output/joiebylise_images.json"
OUTPUT_JSON = "config/jbl_images.json"

BAD_SUBSTRINGS = [
    "Neutral_Minimalist_Artist_Designer_Business_Card",
]

def normalize_url(u: str) -> str:
    u = u.strip()
    if not u:
        return u
    # Protocol-relative: //joiebylise.com/...
    if u.startswith("//"):
        return "https:" + u
    # Absolute
    if u.startswith("http://") or u.startswith("https://"):
        return u
    # Relative path -> assume main site
    if u.startswith("/"):
        return "https://joiebylise.com" + u
    # Fallback: treat as path on main site
    return "https://joiebylise.com/" + u.lstrip("/")

def is_bad(u: str) -> bool:
    return any(bad in u for bad in BAD_SUBSTRINGS)

def slug_from_url(url: str) -> str:
    url = url.strip()
    if not url:
        return ""
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")
    if not path:
        return ""
    return path.split("/")[-1]

def main() -> None:
    if not os.path.exists(INPUT_JSON):
        raise SystemExit(f"Missing input file: {INPUT_JSON}")

    with open(INPUT_JSON, "r") as f:
        raw = json.load(f)

    products = []
    for entry in raw:
        url = entry.get("url", "").strip()
        title = entry.get("title", "").strip()
        raw_images = entry.get("images", []) or []

        # Normalize URLs
        images = [normalize_url(u) for u in raw_images if u and isinstance(u, str)]

        # Pick a primary image: first non-bad, else first available
        primary = None
        for u in images:
            if not is_bad(u):
                primary = u
                break
        if primary is None and images:
            primary = images[0]

        if not url or not primary:
            # Nothing useful for this entry
            continue

        slug = slug_from_url(url)
        products.append(
            {
                "url": url,
                "slug": slug,
                "title": title,
                "image": primary,
            }
        )

    os.makedirs("config", exist_ok=True)
    out = {
        "brand": "joiebylise",
        "source": INPUT_JSON,
        "products": products,
    }
    with open(OUTPUT_JSON, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"✅ Wrote {len(products)} products to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
