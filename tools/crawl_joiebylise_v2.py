import asyncio
import json
import os
from playwright.async_api import async_playwright

START_URL = "https://joiebylise.com/"

OUTPUT_JSON = "output/joiebylise_images.json"
IMAGE_DIR = "output/images"

os.makedirs("output", exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)

async def extract_images(page):
    """Extracts all <img> sources AND CSS background-images."""
    urls = set()

    # Standard <img> sources
    imgs = await page.locator("img").all()
    for img in imgs:
        src = await img.get_attribute("src")
        if src and ("cdn" in src or "files" in src):
            urls.add(src)

    # CSS background-images
    nodes = await page.locator("*").all()
    for e in nodes:
        style = await e.evaluate("el => window.getComputedStyle(el).backgroundImage")
        if style and "url(" in style:
            url = style.split("url(")[1].split(")")[0].strip('"\'')
            if "cdn" in url or "files" in url:
                urls.add(url)

    return list(urls)

async def safe_goto(page, url):
    """Go to page with resilient fallbacks."""
    try:
        await page.goto(url, timeout=60000)
        await page.wait_for_load_state("domcontentloaded")
    except Exception:
        print("⚠️  Warning: DOM did not fully settle, continuing anyway.")

    # Try scrolling to load lazy images
    try:
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(1.2)
    except:
        pass

async def crawl():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("🟦 Crawling homepage…")
        await safe_goto(page, START_URL)

        print("🟦 Extracting product links…")
        links = await page.locator("a[href*='/products/']").all()

        product_urls = set()
        for a in links:
            href = await a.get_attribute("href")
            if href and "/products/" in href:
                product_urls.add(href.split("?")[0])

        product_urls = sorted(product_urls)
        print(f"Found {len(product_urls)} products\n")

        results = []

        for url in product_urls:
            full = url if url.startswith("http") else START_URL.rstrip("/") + url
            print(f"🟩 Product: {full}")

            await safe_goto(page, full)

            title = await page.title()
            images = await extract_images(page)

            results.append({
                "url": full,
                "title": title,
                "images": images,
            })

        with open(OUTPUT_JSON, "w") as f:
            json.dump(results, f, indent=2)

        print(f"\n✅ DONE. Saved data to: {OUTPUT_JSON}")
        await browser.close()

asyncio.run(crawl())
