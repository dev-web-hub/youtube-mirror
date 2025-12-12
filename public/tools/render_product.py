# excerpt: CTA resolution (SAFE VERSION)

def resolve_primary_cta(layout):
    for block in layout.get("blocks", []):
        if block.get("type") == "cta_group":
            primary = block.get("primary", {})
            href = primary.get("href", "")
            if href.startswith("http"):
                return href
    return None
