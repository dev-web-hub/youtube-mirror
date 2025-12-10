import os
import requests
from dotenv import load_dotenv
from pathlib import Path

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

EMAIL = os.getenv("CLOUDFLARE_EMAIL")
GLOBAL_KEY = os.getenv("CLOUDFLARE_GLOBAL_KEY")

if not EMAIL or not GLOBAL_KEY:
    raise RuntimeError("❌ CLOUDFLARE_EMAIL or CLOUDFLARE_GLOBAL_KEY missing from .env")

API_BASE = "https://api.cloudflare.com/client/v4"

HEADERS = {
    "X-Auth-Email": EMAIL,
    "X-Auth-Key": GLOBAL_KEY,
    "Content-Type": "application/json"
}

class CloudflareClient:
    def verify(self):
        r = requests.get(f"{API_BASE}/user", headers=HEADERS)
        return r.json()

    def list_zones(self):
        r = requests.get(f"{API_BASE}/zones", headers=HEADERS)
        return r.json().get("result", [])

    def list_records(self, zone_id):
        r = requests.get(
            f"{API_BASE}/zones/{zone_id}/dns_records",
            headers=HEADERS
        )
        return r.json()

    def upsert_record(self, zone_id, record_id, name, content, rtype="A", ttl=1):
        payload = {
            "type": rtype,
            "name": name,
            "content": content,
            "ttl": ttl,
            "proxied": False
        }

        if record_id:
            r = requests.put(
                f"{API_BASE}/zones/{zone_id}/dns_records/{record_id}",
                headers=HEADERS,
                json=payload
            )
        else:
            r = requests.post(
                f"{API_BASE}/zones/{zone_id}/dns_records",
                headers=HEADERS,
                json=payload
            )

        return r.json()

    def purge_cache(self, zone_id):
        r = requests.post(
            f"{API_BASE}/zones/{zone_id}/purge_cache",
            headers=HEADERS,
            json={"purge_everything": True}
        )
        return r.json()

    def list_workers(self, account_id):
        r = requests.get(
            f"{API_BASE}/accounts/{account_id}/workers/services",
            headers=HEADERS,
        )
        return r.json()

    def list_kv(self, account_id):
        r = requests.get(
            f"{API_BASE}/accounts/{account_id}/storage/kv/namespaces",
            headers=HEADERS,
        )
        return r.json()

    def list_r2(self, account_id):
        r = requests.get(
            f"{API_BASE}/accounts/{account_id}/r2/buckets",
            headers=HEADERS,
        )
        return r.json()
