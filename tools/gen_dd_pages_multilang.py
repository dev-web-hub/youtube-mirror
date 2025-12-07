#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from typing import Dict, List, Any

ROOT = Path(__file__).resolve().parent.parent
CAMPAIGNS_JSON = ROOT / "config" / "campaigns_master.json"
PRODUCTS_JSON = ROOT / "config" / "dd_products.json"
OUTPUT_DIR = ROOT / "public" / "pages" / "dd_prod"

AFFILIATE_NOTES = {
    "en": "As an affiliate, I may earn a commission from qualifying purchases.",
    "fr": "En tant que partenaire, je peux recevoir une commission sur les achats admissibles.",
}

CTA_LABELS = {
    "en": "Shop now",
    "fr": "Magasiner",
}

EYEBROWS = {
    "en": "Featured offer",
    "fr": "Offre vedette",
}


def load_campaigns() -> Dict[str, Dict[str, Any]]:
    with CAMPAIGNS_JSON.open("r") as f:
        data = json.load(f)

    # support either {"campaigns": [...]} or plain list
    if isinstance(data, dict) and "campaigns" in data:
        campaigns_list = data["campaigns"]
    else:
        campaigns_list = data

    campaigns: Dict[str, Dict[str, Any]] = {}
    for c in campaigns_list:
        cid = str(c.get("id") or c.get("campaign_id") or "").strip()
        if not cid:
            continue
        campaigns[cid] = c
    return campaigns


def load_products() -> List[Dict[str, Any]]:
    with PRODUCTS_JSON.open("r") as f:
        data = json.load(f)
    if isinstance(data, dict) and "products" in data:
        return data["products"]
    return data


def build_page_json(
    campaign: Dict[str, Any],
    product: Dict[str, Any],
    base_id: str,
    lang: str,
) -> Dict[str, Any]:
    campaign_id = str(campaign.get("id") or campaign.get("campaign_id") or "").strip()
    campaign_title = str(campaign.get("title") or "").strip()

    product_name = (
        str(product.get("name") or product.get("title") or "").strip()
    )
    product_url = str(product.get("url") or "").strip()

    if not product_name or not product_url:
        raise ValueError("Missing product name or url")

    # Language-specific text
    eyebrow = EYEBROWS.get(lang, EYEBROWS["en"])
    cta_label = CTA_LABELS.get(lang, CTA_LABELS["en"])
    affiliate_note = AFFILIATE_NOTES.get(lang, AFFILIATE_NOTES["en"])

    if lang == "fr":
        subtitle_base = f"Choix vedette de notre collection « {campaign_title} »."
    else:
        subtitle_base = f"Hand-picked from our “{campaign_title}” collection."

    subtitle = f"{subtitle_base} {affiliate_note}"

    # One redirect per product (same for all languages)
    redirect_href = f"https://deluxedeals.ca/go/{base_id}"

    page_id = f"{base_id}_{lang}"

    return {
        "meta": {
            "id": page_id,
            "brand": "deluxedeals",
            "campaign_id": campaign_id,
            "campaign_title": campaign_title,
            "lang": lang,
        },
        "blocks": [
            {
                "type": "hero",
            "image": product.get("image"),
                "eyebrow": eyebrow,
                "title": product_name,
                "subtitle": subtitle,
            },
            {
                "type": "cta_button",
                "label": cta_label,
                "href": redirect_href,
            },
        ],
    }


def generate_pages(langs: List[str], max_pages: int) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    campaigns = load_campaigns()
    products = load_products()

    per_campaign_counters: Dict[str, int] = {}
    total_written = 0

    for product in products:
        if total_written >= max_pages:
            break

        # Try several common keys for campaign id
        cid = str(
            product.get("campaign_id")
            or product.get("campaign")
            or product.get("campaignId")
            or ""
        ).strip()

        if not cid or cid not in campaigns:
            print(f"Skipping product with unknown campaign: {product}")
            continue

        per_campaign_counters.setdefault(cid, 0)
        per_campaign_counters[cid] += 1
        idx = per_campaign_counters[cid]

        base_id = f"dd_{cid}_{idx:04d}"

        for lang in langs:
            try:
                data = build_page_json(campaigns[cid], product, base_id, lang)
            except ValueError as e:
                print(f"Skipping invalid product in campaign {cid}: {product} ({e})")
                continue

            out_name = f"{base_id}_{lang}.json"
            out_path = OUTPUT_DIR / out_name
            with out_path.open("w") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"Wrote {out_path.relative_to(ROOT)}")
            total_written += 1

            if total_written >= max_pages:
                break

    print(f"Generated {total_written} files.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate DeluxeDeals product pages in multiple languages."
    )
    parser.add_argument(
        "--langs",
        type=str,
        default="en,fr",
        help="Comma-separated language codes (default: en,fr)",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=100,
        help="Max total pages to generate (all campaigns combined).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    langs = [code.strip() for code in args.langs.split(",") if code.strip()]
    generate_pages(langs=langs, max_pages=args.max_pages)


if __name__ == "__main__":
    main()
