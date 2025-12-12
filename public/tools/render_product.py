#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def die(msg):
    print(f"[ERR] {msg}", file=sys.stderr)
    sys.exit(1)

def esc(s: str) -> str:
    return (s or "").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;")

def render_blocks(layout: dict) -> str:
    blocks = layout.get("blocks", [])
    meta = layout.get("meta", {})
    status = esc(meta.get("status",""))
    brand = esc(meta.get("brand",""))
    pill = f'''
    <div class="pill">
      <span class="pill-dot"></span>
      <span>{esc(brand)} · {esc(status)}</span>
    </div>'''.strip()

    parts = [pill]

    for b in blocks:
        t = b.get("type","")
        if t == "hero":
            img = esc(b.get("img","hero.png"))
            title = esc(b.get("title",""))
            subtitle = esc(b.get("subtitle",""))
            parts.append(f'''
    <div class="hero">
      <img src="{img}" alt="hero" onerror="this.style.display='none'"/>
    </div>
    <h1>{title}</h1>
    <div class="subhead">{subtitle}</div>'''.strip())
        elif t == "badges":
            items = b.get("items", [])
            lis = "\n".join([f"<li>{esc(x)}</li>" for x in items])
            parts.append(f'<ul class="bullets">\n{lis}\n</ul>')
        elif t == "cta_group":
            primary = b.get("primary", {})
            p_label = esc(primary.get("label",""))
            p_href = esc(primary.get("href",""))
            secondary = b.get("secondary", [])
            sec_links = []
            for s in secondary:
                sec_links.append(
                    f'<a class="cta-secondary" href="{esc(s.get("href",""))}">{esc(s.get("label",""))}</a>'
                )
            sec_html = "\n".join(sec_links)
            parts.append(f'''
    <div class="cta-row">
      <a class="cta-primary" href="{p_href}">{p_label}</a>
      {sec_html}
    </div>'''.strip())
        elif t == "footnote":
            txt = esc(b.get("text",""))
            parts.append(f'<div class="footnote">{txt}</div>')
        else:
            # unknown block type is allowed; keep deterministic placeholder
            parts.append(f'<div class="footnote">[TODO] Unknown block: {esc(t)}</div>')

    return "\n\n".join(parts)

def main():
    if len(sys.argv) != 4:
        die("Usage: render_product.py <template.html> <layout.json> <out_index.html>")

    template_path = Path(sys.argv[1])
    layout_path = Path(sys.argv[2])
    out_path = Path(sys.argv[3])

    tpl = template_path.read_text(encoding="utf-8")
    layout = json.loads(layout_path.read_text(encoding="utf-8"))

    meta = layout.get("meta", {})
    title = meta.get("title") or layout.get("id") or "Product"
    desc = meta.get("description") or ""
    lang = meta.get("lang") or "en"

    body = render_blocks(layout)

    html = (tpl
        .replace("{{TITLE}}", esc(title))
        .replace("{{DESCRIPTION}}", esc(desc))
        .replace("{{LANG}}", esc(lang))
        .replace("{{BODY}}", body)
    )

    out_path.write_text(html, encoding="utf-8")
    print(f"[OK] Rendered: {out_path}")

if __name__ == "__main__":
    main()
