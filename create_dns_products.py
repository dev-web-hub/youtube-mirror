from client import CloudflareClient

cf = CloudflareClient()
ZONE_ID = "2a871213bb0e2b998d22b58f4fd86987"  # deluxedeals.net

resp = cf.create_dns_record(
    zone_id=ZONE_ID,
    type="CNAME",
    name="products",
    content="youtube-mirror.onrender.com",
    proxied=True
)

print(resp)
