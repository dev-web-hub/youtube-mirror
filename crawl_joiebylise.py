import asyncio
import json
import os
from playwright.async_api import async_playwright

BASE_URL = "https://joiebylise.com"
OUTPUT_DIR = "output"
IMG_DIR = os.path.join(OUTPUT_DIR, "images")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(IMG_DIR, exist_ok=True)


async def scroll_page(page):
    """Scroll to bottom to load lazy-loaded images."""
    last_height = await page.evaluate("document.body.scrollHeight")
    while True:
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(800)
        new_height = await page.evaluate("document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height


async def extract_product_links(page):
    links = await page.eval_on_selector_all(
        "a[href*='/products/']",
        "elements => elements.map(e => e.href)"
    )
    return list(dict.fromkeys(links))  # dedupe


async def extract_product_data(page, url):
    await page.goto(url)
    await scroll_page(page)

    title = await page.title()

    img_urls = await page.eval_on_selector_all(
        "img[src]",
        "imgs => imgs.map(i => i.src)"
    )

    # Only keep Shopify CDN images
    img_urls = [u for u in img_urls if "cdn.shopify.com" in u]

    return {
        "url": url,
        "title": title,
        "images": img_urls
    }


async def download_image(page, url, filename):
    save_path = os.path.join(IMG_DIR, filename)
    try:
        img_bytes = await page.evaluate(
            """async (url) => {
                const res = await fetch(url);
                const buf = await res.arrayBuffer();
                return Array.from(new Uint8Array(buf));
            }""",
            url,
        )
        with open(save_path, "wb") as f:
            f.write(bytes(img_bytes))
        print(f"Downloaded: {filename}")
    except Exception as e:
        print(f"Failed to download image {url}: {e}")


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()

        print("🟦 Crawling homepage…")
        await page.goto(BASE_URL)
        await scroll_page(page)

        print("🟦 Extracting product links…")
        links = await extract_product_links(page)
        print(f"Found {len(links)} products")

        results = []

        for url in links:
            print(f"\n🟩 Product: {url}")
            data = await extract_product_data(page, url)
            results.append(data)

            # Download images
            for idx, img_url in enumerate(data["images"]):
                filename = f"{data['title'].replace(' ', '_')}_{idx}.jpg"
                await download_image(page, img_url, filename)

        # Save JSON index
        json_path = os.path.join(OUTPUT_DIR, "joiebylise_images.json")
        with open(json_path, "w") as f:
            json.dump(results, f, indent=2)

        print(f"\n✅ DONE. Saved data to: {json_path}")
        print(f"📁 Images downloaded to: {IMG_DIR}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
