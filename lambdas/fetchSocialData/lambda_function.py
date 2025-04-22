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

def classify_crypto_sentiment(text):
    bullish_keywords = [
        "moon", "rocket", "bull", "bullish", "rally", "breakout", "pumping",
        "skyrocketing", "run", "green candle", "to the moon", "back to the bull run",
        "hodl", "buy the dip", "invest", "profit", "gain", "positive"
    ]
    bearish_keywords = [
        "dump", "crash", "bear", "bearish", "scared", "plummet", "correction", "bloodbath",
        "red candle", "panic selling", "sell off", "loss", "negative", "fear", "uncertainty",
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

# --- Main Lambda Handler ---

def lambda_handler(event, context):
    reddit_posts = []
    reddit_token = get_reddit_token()
    subreddits = ["Bitcoin", "CryptoCurrency", "CryptoMarkets"]

    for subreddit in subreddits:
        titles = fetch_subreddit_posts(subreddit, reddit_token, limit=100)
        relevant_titles = [title for title in titles if is_relevant(title)]
        print(f"{subreddit}: {len(relevant_titles)} relevant out of {len(titles)}")
        reddit_posts.extend(relevant_titles)

    reddit_posts = reddit_posts[:20] # Set to 20 for testing
    print(f"\n🟥 Analysing {len(reddit_posts)} Reddit posts for sentiment...\n")
    analysed_reddit = analyse_sentiment(reddit_posts)

    for post in analysed_reddit:
        print(f"[Reddit] {post['title']} → {post['sentiment']} (Score: {post['score']})")

    news_posts = fetch_bitcoin_news_sentiment()
    print(f"\n📰 Fetched {len(news_posts)} Bitcoin news headlines with sentiment:\n")
    for article in news_posts:
        print(f"[News] {article['title']} → {article['sentiment']} (Score: {article['score']})")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "reddit sentiment": analysed_reddit,
            "news sentiment": news_posts
        })
    }
