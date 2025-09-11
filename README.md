# Bitcoin Bear–Bull Meter

Serverless dashboard for Bitcoin sentiment and price. The UI blends Reddit + news sentiment, the Fear & Greed index, and BTC price into a clean, responsive view.

**Live site:** https://main.d11ad1n2ryjclk.amplifyapp.com/  
**Stack:** React · **AWS Amplify (Hosting & CI/CD)** · AWS Lambda + EventBridge · S3 (JSON cache) · CoinGecko · AWS Comprehend · (News API via AlphaVantage)

---

## What it does
- **Sentiment gauge (0–100)** with a red → orange → green arc that fills only to the score (responsive; tick labels align to the ends).
- **Market news ticker** with constant pixel‑per‑second speed (independent of headline count).
- **Reddit rotator**: shows 3 posts and page‑rotates every 30s with an accurate countdown (no drift when the tab is inactive).
- **Fear & Greed mini‑gauge** with score + label and source attribution.
- **BTC price card**: live price, 30‑day % change, sparkline (no SVG clipping).

---

## Repo layout
```
frontend/                # React app hosted by Amplify
lambdas/
  fetchBTCPriceUSD/      # Lambda: writes price.json
  fetchSocialData/       # Lambda: writes sentiment-latest.json + history.json
.github/workflows/       # GitHub Actions (CI/CD for Lambdas, Amplify auto‑builds frontend)
```
> The frontend fetches S3 JSON directly (see `src/api/useSentiment.js` and `src/api/usePrice.js`).

---

## Data contracts (S3 JSON)

### `sentiment-latest.json`
```json
{
  "reddit": {
    "average_score": 48.7,
    "label": "BULLISH",
    "posts": [{ "title": "..." }]
  },
  "news": {
    "average_score": 75.2,
    "label": "BULLISH",
    "posts": [{ "title": "..." }]
  },
  "fear_and_greed_index": { "score": 51, "label": "Neutral" },
  "overall": { "average_score": 58, "label": "BULLISH" }
}
```

### `history.json`
```json
[ { "date": "2025-08-01", "score": 65 }, { "date": "2025-08-02", "score": 62 } ]
```

### `price.json`
```json
{
  "price_usd": 64250.12,
  "change_pct_30d": 1.87,
  "history_usd": [61200.2, 61810.5, 62333.1]
}
```

---

## Backend functions

### 1) **Fetch Social Data / Sentiment** (Lambda)
**Purpose:** Build the latest sentiment snapshot and keep a rolling daily history.

**Inputs & sources**
- Reddit titles (curated list of crypto subreddits/feeds).
- News headlines (AlphaVantage `NEWS_SENTIMENT`).
- AWS Comprehend for sentiment classification.

**Processing**
- Score each title/headline via Comprehend and a market polarity map.
- Combine to a **normalized 0–100 score**; compute label (Bearish/Neutral/Bullish).
- Produce a full snapshot (`sentiment-latest.json`) and append/roll **`history.json`** once per UTC day.

**Environment variables**
```
S3_BUCKET=<your-bucket>
OBJECT_KEY_LATEST=sentiment-latest.json
OBJECT_KEY_HISTORY=history.json
ALPHAVANTAGE_API_KEY=<key>
AWS_REGION=<comprehend-region>   # or rely on Lambda's region
```

**Schedule:** EventBridge rule daily (6am UTC).

**IAM (writer scope)**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:PutObject"],
      "Resource": [
        "arn:aws:s3:::<your-bucket>/sentiment-latest.json",
        "arn:aws:s3:::<your-bucket>/history.json"
      ]}
  ]
}
```

---

### 2) **Fetch BTC Price USD** (Lambda)
**Purpose:** Provide live price + 30‑day history and 30‑day % change for the Price card.

**Environment variables**
```
S3_BUCKET=<your-bucket>
OBJECT_KEY=price.json
```

**Schedule:** EventBridge rule every 10 minutes.

**IAM (writer scope)**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::<your-bucket>/price.json" }
  ]
}
```

---

## CI/CD — GitHub Actions (deploy Lambdas)

> Amplify picks up **frontend** changes from GitHub automatically and builds/hosts the React app; you don’t run a separate action for the frontend. For **Lambdas**, the two workflows (deploy-fetch-price.yml and deploy-fetch-social.yml) zip and deploy on push to `main` when files in each Lambda folder change.

**Secrets required (repo → Settings → Secrets and variables → Actions)**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (e.g. `us-east-1`)

> If your Lambda function names differ, update `--function-name` accordingly.

---

## Amplify hosting (frontend)

- Amplify is connected to this GitHub repo and builds on **push to `main`**.  
- If you ever externalise the data base URL, add it as an env var in Amplify build settings (e.g., `REACT_APP_DATA_BASE`). Currently, the app points directly at your S3 endpoints in code.

---

## Security

S3 bucket policy: public **GET** on the three JSON objects only (no bucket listing, no writes). Writers are Lambdas with least‑privilege `s3:PutObject` on those keys. Prefer **Bucket owner enforced** for Object Ownership and avoid object ACLs in code. You can optionally hide the bucket behind CloudFront (OAC) and point the app to the CDN domain.

CORS for S3:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET","HEAD"],
    "AllowedOrigins": ["http://localhost:3000","https://main.d11ad1n2ryjclk.amplifyapp.com"],
    "ExposeHeaders": []
  }
]
```

---

## Local development
```bash
cd frontend
npm i
npm start
```

---

## License
MIT
