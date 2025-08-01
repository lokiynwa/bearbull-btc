import os
import json
import requests
from datetime import datetime, timedelta
from base64 import b64encode
import boto3

s3 = boto3.client("s3")
BUCKET = os.environ['S3_BUCKET']
if not BUCKET:
    raise ValueError("S3_BUCKET environment variable not set.")

def save_latest_snapshot_and_update_history(s3, bucket, snapshot_data, overall_score, date_str):
    # 1. Save the new day's full snapshot (replace sentiment-latest.json)
    try:
        s3.put_object(
            Bucket=bucket,
            Key="sentiment-latest.json",
            Body=json.dumps(snapshot_data, indent=2),
            ContentType="application/json"
        )
        print("[INFO] Latest snapshot for today saved successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to save latest full snapshot: {e}")
        raise

    # 2. Update history.json (append today's date and score)
    try:
        try:
            obj = s3.get_object(Bucket=bucket, Key="history.json")
            history = json.loads(obj["Body"].read())
        except s3.exceptions.NoSuchKey:
            history = []
        except Exception as e:
            print(f"[WARN] Could not load history.json: {e}")
            history = []

        history = [h for h in history if h.get("date") != date_str]
        history.append({"date": date_str, "score": overall_score})

        history = history[-2000:]

        s3.put_object(
            Bucket=bucket,
            Key="history.json",
            Body=json.dumps(history, indent=2),
            ContentType="application/json"
        )
        print("[INFO] History updated.")

    except Exception as e:
        print(f"[ERROR] Could not update history.json: {e}")
        raise



comprehend = boto3.client("comprehend")

# --- Reddit Token and Fetching ---

def get_reddit_token():
    client_id = os.environ['REDDIT_CLIENT_ID']
    client_secret = os.environ['REDDIT_CLIENT_SECRET']
    
    auth = b64encode(f"{client_id}:{client_secret}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth}",
        "User-Agent": "bear-bull-sentiment/0.1"
    }
    data = {"grant_type": "client_credentials"}
    
    res = requests.post("https://www.reddit.com/api/v1/access_token", headers=headers, data=data)
    token = res.json().get("access_token")
    return token

def is_relevant(title):
    title_lower = title.lower()

    if title_lower.startswith("how "):
        return False
    
    if title_lower.startswith("i "):
        return True
    
    keywords = [
        "worried", "excited", "scared", "fear", "greed", "panic", "nervous", "bullish",
        "bearish", "strategy", "bull", "bear", "run", "crash", "dump", "buy", "sell",
        "hodl", "invest", "investment", "rebound", "rally", "risky", "profit", "loss",
        "dip", "discount", "accumulate", "strong", "weak", "pump", "correction", "short", "long"
    ]
    return any(keyword in title_lower for keyword in keywords)


def fetch_subreddit_posts(subreddit, token, limit=100):
    headers = {
        "Authorization": f"bearer {token}",
        "User-Agent": "bear-bull-sentiment/0.1"
    }
    url = f"https://oauth.reddit.com/r/{subreddit}/top?t=day&limit={limit}"
    res = requests.get(url, headers=headers)
    posts = res.json().get("data", {}).get("children", [])
    return [post["data"]["title"] for post in posts]

# --- News Posts Fetching ---

def fetch_bitcoin_news_sentiment():
    try:
        api_key = os.environ["ALPHAVANTAGE_API_KEY"]
    except KeyError:
        print("[ERROR] ALPHAVANTAGE_API_KEY environment variable not set.")
        return []

    time_from = (datetime.utcnow() - timedelta(days=1)).strftime("%Y%m%dT%H%M")

    url = (
        f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT"
        f"&tickers=CRYPTO:BTC"
        f"&time_from={time_from}"
        f"&limit=20"
        f"&sort=LATEST"
        f"&apikey={api_key}"
    )

    try:
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()

        if "feed" not in data:
            print(f"[WARN] No 'feed' in response: {data}")
            return []

        articles = data["feed"]

        return [
            {
                "title": a["title"],
                "sentiment": a.get("overall_sentiment_label"),
                "score": a.get("overall_sentiment_score")
            }
            for a in articles if "title" in a
        ]

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request to Alpha Vantage failed: {e}")
    except ValueError:
        print("[ERROR] Failed to parse JSON response from Alpha Vantage.")
    except Exception as e:
        print(f"[ERROR] Unexpected error in fetch_bitcoin_news_sentiment: {e}")

    return []


def fetch_fear_and_greed_index():
    try:
        url = "https://api.alternative.me/fng/?limit=1"
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json().get("data", [])
        if data:
            value = int(data[0]['value'])
            classification = data[0]['value_classification']
            return {
                "classification": classification,
                "score": float(value)
            }
    except requests.exceptions.RequestException as e:
        print(f"Could not fetch Fear and Greed Index: {e}")
    except (KeyError, IndexError, ValueError) as e:
        print(f"Error parsing Fear and Greed Index data: {e}")
    
    return None

def classify_crypto_sentiment(text):
    bullish_keywords = [
        "moon", "rocket", "bull", "bullish", "rally", "breakout", "pumping",
        "skyrocketing", "run", "green candle", "to the moon", "back to the bull run",
        "hodl", "buy the dip", "invest", "profit", "gain", "rallies", "discount", "cheap",
        "uptrend", "optimistic", "surge", "rise", "increase", "gain", "accumulate", "strong", "ATH",
        "pump", "rebound", "recover", "buying", "bought", "long"
    ]
    bearish_keywords = [
        "dump", "crash", "bear", "bearish", "scared", "plummet", "correction", "bloodbath",
        "red candle", "panic selling", "sell off", "loss", "dip", "dropping", "decline",
        "weak", "liquidation", "sell", "selling", "short"
    ]
    text = text.lower()
    if any(word in text for word in bullish_keywords):
        return "BULLISH"
    elif any(word in text for word in bearish_keywords):
        return "BEARISH"
    else:
        return "UNKNOWN"

def map_sentiment_to_score(comp_score, market_sentiment):
    pos = comp_score["Positive"]
    neg = comp_score["Negative"]

    if pos > 0.5 and market_sentiment == "BULLISH":
        return 0.5
    elif pos > 0.5 and market_sentiment == "UNKNOWN":
        return 0.2
    elif pos > 0.5 and market_sentiment == "BEARISH":
        return 0.05

    if neg > 0.5 and market_sentiment == "BEARISH":
        return -0.5
    elif neg > 0.5 and market_sentiment == "UNKNOWN":
        return -0.2
    elif neg > 0.5 and market_sentiment == "BULLISH":
        return -0.05

    if market_sentiment == "BULLISH":
        return 0.25
    elif market_sentiment == "BEARISH":
        return -0.25

    return 0.0

def score_label(score):
    if score <= -0.35:
        return "BEARISH"
    elif -0.35 < score <= -0.15:
        return "SOMEWHAT_BEARISH"
    elif -0.15 < score < 0.15:
        return "NEUTRAL"
    elif 0.15 <= score < 0.35:
        return "SOMEWHAT_BULLISH"
    else:
        return "BULLISH"

def analyse_sentiment(posts):
    results = []
    errors = 0

    for title in posts[:20]:
        market_sentiment = classify_crypto_sentiment(title)
        if market_sentiment == "UNKNOWN":
            continue

        try:
            response = comprehend.detect_sentiment(Text=title, LanguageCode="en")
            sentiment = response["Sentiment"]
            score = response["SentimentScore"]
            final_score = map_sentiment_to_score(score, market_sentiment)
            label = score_label(final_score)

            results.append({
                "title": title,
                "comprehend_sentiment": sentiment,
                "comprehend_score": score,
                "market_sentiment": market_sentiment,
                "final_score": final_score,
                "sentiment_label": label
            })

        except Exception as e:
            print(f"[WARN] Failed sentiment analysis for: '{title[:80]}' → {e}")
            errors += 1

    print(f"[INFO] Sentiment analysis: {errors} failed, {len(results)} succeeded.")

    return results

# --- Main Lambda Handler ---

def lambda_handler(event, context):
    reddit_token = get_reddit_token()
    subreddits = ["Bitcoin", "CryptoCurrency", "CryptoMarkets"]
    reddit_posts = []
    for subreddit in subreddits:
        titles = fetch_subreddit_posts(subreddit, reddit_token, limit=100)
        reddit_posts.extend([title for title in titles if is_relevant(title)])
    reddit_posts = reddit_posts[:80]

    analysed_reddit = analyse_sentiment(reddit_posts)

    if analysed_reddit:
        reddit_avg = sum([p['final_score'] for p in analysed_reddit]) / len(analysed_reddit) * 100 + 50
        reddit_label = score_label(reddit_avg)
    else:
        reddit_avg = None
        reddit_label = "N/A"

    news_posts = fetch_bitcoin_news_sentiment()
    news_scores = []

    for article in news_posts:
        try:
            score = float(article['score'])
            news_scores.append(score)
        except (KeyError, TypeError, ValueError):
            print(f"[WARN] Skipping invalid news score: {article.get('score')}")

    if news_scores:
        capped_avg = max(-0.5, min(0.5, sum(news_scores) / len(news_scores) * 1.5))
        news_avg = round(capped_avg * 100 + 50, 2)
        news_label = score_label(news_avg)
    else:
        news_avg = None
        news_label = "N/A"

    fng_data = fetch_fear_and_greed_index()
    
    if fng_data:
        fng_score = fng_data["score"]
        fng_label = fng_data["classification"]
    else:
        fng_score = None
        fng_label = "N/A"

    valid_scores = [score for score in [reddit_avg, news_avg, fng_score] if score is not None]

    if valid_scores:
        overall_score = round(sum(valid_scores) / len(valid_scores))
        overall_label = score_label(overall_score)
    else:
        overall_score = None
        overall_label = "N/A"

    print(f"Reddit Sentiment → {reddit_label} ({reddit_avg:.3f})" if reddit_avg is not None else "Reddit Sentiment → N/A")
    print(f"\nNews Sentiment → {news_label} ({news_avg:.3f})" if news_avg is not None else "News Sentiment → N/A")
    print(f"\nFear and Greed Index → {fng_label} ({fng_score:.3f})" if fng_score is not None else "Fear and Greed Index → N/A")
    print(f"\nOverall Market Sentiment → {overall_label} ({overall_score})" if overall_score is not None else "Overall Market Sentiment → N/A")

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    full_snapshot = {
        "reddit": {
            "average_score": round(reddit_avg, 3) if reddit_avg is not None else None,
            "label": reddit_label,
            "posts": analysed_reddit
        },
        "news": {
            "average_score": round(news_avg, 3) if news_avg is not None else None,
            "label": news_label,
            "posts": news_posts
        },
        "fear_and_greed_index": {
            "score": fng_score,
            "label": fng_label
        },
        "overall": {
            "average_score": overall_score,
            "label": overall_label
        }
    }
    if overall_score is not None:
        try:
            save_latest_snapshot_and_update_history(
                s3, BUCKET, full_snapshot, overall_score, today_str
            )
        except Exception as e:
            print(f"[WARN] Could not update snapshot/history: {e}")

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(full_snapshot)
    }

