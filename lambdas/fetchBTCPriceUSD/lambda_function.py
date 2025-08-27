import os, json, datetime
import urllib3, boto3
from urllib3.util import Retry
from urllib3.util.timeout import Timeout

BUCKET = os.environ.get("S3_BUCKET", "crypto-sentiment-cache-loki")
KEY    = os.environ.get("OBJECT_KEY",  "price.json")
COIN   = "bitcoin"
VS     = "usd"

http = urllib3.PoolManager(
    timeout=Timeout(connect=5, read=15),
    retries=Retry(total=3, backoff_factor=0.3, status_forcelist=[429, 500, 502, 503, 504]),
)
s3 = boto3.client("s3")

def get_json(url):
    r = http.request("GET", url, headers={"User-Agent": "price-lambda/1.0"})
    if r.status >= 400:
        raise RuntimeError(f"HTTP {r.status} for {url}")
    return json.loads(r.data.decode("utf-8"))

def fetch_latest():
    url = (
        "https://api.coingecko.com/api/v3/simple/price"
        f"?ids={COIN}&vs_currencies={VS}&include_24hr_change=true"
    )
    d = get_json(url)
    price = float(d[COIN][VS])
    change_24h = float(d[COIN][f"{VS}_24h_change"])
    return price, change_24h

def fetch_history(days=30):
    url = (
        f"https://api.coingecko.com/api/v3/coins/{COIN}/market_chart"
        f"?vs_currency={VS}&days={days}&interval=daily"
    )
    d = get_json(url)
    prices = [float(p[1]) for p in d.get("prices", [])]
    return prices[-days:] if prices else []

def lambda_handler(event, context):
    price, change_24h = fetch_latest()
    history = fetch_history(30)
    change_30d = None
    if len(history) >= 2 and history[0] > 0:
        change_30d = (history[-1] - history[0]) / history[0] * 100.0

    payload = {
        "updated_at": datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "symbol": "BTC",
        "price_usd": round(price, 2),
        "change_pct_24h": round(change_24h, 2),
        "change_pct_30d": round(change_30d, 2) if change_30d is not None else None,
        "history_usd": [round(x, 2) for x in history],
    }

    s3.put_object(
        Bucket=BUCKET,
        Key=KEY,
        Body=json.dumps(payload, separators=(",", ":")),
        ContentType="application/json",
        CacheControl="max-age=60",
    )

    return {"statusCode": 200, "body": json.dumps({"ok": True, "bucket": BUCKET, "key": KEY})}
