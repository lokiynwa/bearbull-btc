import os
import json
import requests
from datetime import datetime, timedelta
from base64 import b64encode
import boto3

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
        "worried", "excited", "scared", "unsure", "feel", "hype", "dumping",
        "moon", "fear", "greed", "panic", "nervous", "bullish", "bearish",
        "confused", "think", "believe", "bet", "opinion", "strategy", "bull",
        "bear", "run", "crash", "dump", "buy", "sell", "hodl", "invest", "investment",
        "rebound", "rally", "risky"
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
    api_key = os.environ["ALPHAVANTAGE_API_KEY"]
    time_from = (datetime.utcnow() - timedelta(days=1)).strftime("%Y%m%dT%H%M")

    url = (
        f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT"
        f"&tickers=CRYPTO:BTC"
        f"&time_from={time_from}"
        f"&limit=20" # Set to 20 for testing
        f"&sort=LATEST"
        f"&apikey={api_key}"
    )

    try:
        res = requests.get(url, timeout=5)
        data = res.json()
        articles = data.get("feed", [])
        return [
            {
                "title": a["title"],
                "sentiment": a.get("overall_sentiment_label"),
                "score": a.get("overall_sentiment_score")
            }
            for a in articles if "title" in a
        ]
    except Exception as e:
        print(f"Alpha Vantage error: {e}")
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
        "hodl", "buy the dip", "invest", "profit", "gain", "rallies",
        "uptrend", "optimistic", "surge", "rise", "increase", "gain" 
    ]
    bearish_keywords = [
        "dump", "crash", "bear", "bearish", "scared", "plummet", "correction", "bloodbath",
        "red candle", "panic selling", "sell off", "loss"
    ]
    text = text.lower()
    if any(word in text for word in bullish_keywords):
        return "BULLISH"
    elif any(word in text for word in bearish_keywords):
        return "BEARISH"
    else:
        return "UNKNOWN"


def analyse_sentiment(posts):
    results = []
    
    for title in posts[:100]:
        try:
            response = comprehend.detect_sentiment(Text=title, LanguageCode="en")
            sentiment = response["Sentiment"]
            score = response["SentimentScore"]

            # Add financial-specific sentiment
            crypto_sentiment = classify_crypto_sentiment(title)

            results.append({
                "title": title,
                "comprehend_sentiment": sentiment,
                "comprehend_score": score,
                "market_sentiment": crypto_sentiment
            })
        except Exception as e:
            print(f"Sentiment analysis failed: {e}")
    
    return results

def map_sentiment_to_score(comp_score, market_sentiment):
    pos = comp_score["Positive"]
    neg = comp_score["Negative"]
    mixed = comp_score["Mixed"]
    neutral = comp_score["Neutral"]

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
    for title in posts[:20]:
        try:
            response = comprehend.detect_sentiment(Text=title, LanguageCode="en")
            sentiment = response["Sentiment"]
            score = response["SentimentScore"]
            market_sentiment = classify_crypto_sentiment(title)
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
            print(f"Sentiment analysis failed: {e}")
    return results

# --- Main Lambda Handler ---

def lambda_handler(event, context):
    reddit_token = get_reddit_token()
    subreddits = ["Bitcoin", "CryptoCurrency", "CryptoMarkets"]
    reddit_posts = []
    for subreddit in subreddits:
        titles = fetch_subreddit_posts(subreddit, reddit_token, limit=100)
        reddit_posts.extend([title for title in titles if is_relevant(title)])
    reddit_posts = reddit_posts[:20]

    analysed_reddit = analyse_sentiment(reddit_posts)
    reddit_avg = sum([p['final_score'] for p in analysed_reddit]) / len(analysed_reddit) * 100 + 50 if analysed_reddit else None
    reddit_label = score_label(reddit_avg) if reddit_avg is not None else "N/A"

    news_posts = fetch_bitcoin_news_sentiment()
    news_scores = [a['score'] for a in news_posts if isinstance(a['score'], (int, float))]
    news_avg = sum(news_scores) / len(news_scores) * 100 + 50 if news_scores else None
    news_label = score_label(news_avg) if news_avg is not None else "N/A"

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

    print(f"\nReddit Sentiment → {reddit_label} ({reddit_avg:.3f})")
    print(f"News Sentiment → {news_label} ({news_avg:.3f})")
    print(f"News Sentiment → {fng_label} ({fng_score:.3f})")
    print(f"Overall Market Sentiment → {overall_label} ({overall_score})")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "reddit": {
                "average_score": reddit_avg,
                "label": reddit_label,
                "posts": analysed_reddit
            },
            "news": {
                "average_score": news_avg,
                "label": news_label,
                "posts": news_posts
            },
            "overall": {
                "average_score": overall_score,
                "label": overall_label
            }
        })
    }
