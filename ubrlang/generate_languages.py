import json, sys
from pathlib import Path

SRC = Path("../public/products/youtube-uploader/uploader.layout.json")
OUT = Path("./out")
OUT.mkdir(exist_ok=True)

LANGS = {
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "hi": "Hindi",
    "ja": "Japanese",
    "zh": "Chinese"
}

# Very lightweight phrase translations (no API dependency)
DIC = {
    "Upload 100 Shorts in minutes, not hours.": {
        "fr": "Téléchargez 100 Shorts en quelques minutes, pas des heures.",
        "es": "Sube 100 Shorts en minutos, no horas.",
        "de": "Lade 100 Shorts in Minuten hoch, nicht Stunden.",
        "it": "Carica 100 Shorts in pochi minuti, non ore.",
        "pt": "Envie 100 Shorts em minutos, não horas.",
        "hi": "100 शॉर्ट्स मिनटों में अपलोड करें, घंटों में नहीं।",
        "ja": "100本のショーツを数分でアップロード。",
        "zh": "几分钟内上传100条短片，而不是几个小时。"
    }
}

base = json.loads(SRC.read_text())

for code, lang in LANGS.items():
    variant = json.loads(json.dumps(base))  # deep copy

    # translate hero line
    hero = variant["blocks"][0]
    original = hero["title"]
    hero["title"] = DIC.get(original, {}).get(code, original)

    variant["meta"]["language"] = code
    variant["meta"]["language_label"] = lang

    OUT.write_text  # explicit no-op for clarity

    fname = OUT / f"uploader.{code}.json"
    fname.write_text(json.dumps(variant, indent=2))

print("✅ Generated:", len(LANGS), "language variants")
