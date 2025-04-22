import os
import json
import requests
from datetime import datetime, timedelta
from base64 import b64encode
import feedparser

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

def fetch_subreddit_posts(subreddit, token, limit=100):
    headers = {
        "Authorization": f"bearer {token}",
        "User-Agent": "bear-bull-sentiment/0.1"
    }
    url = f"https://oauth.reddit.com/r/{subreddit}/top?t=day&limit={limit}"
    res = requests.get(url, headers=headers)
    posts = res.json().get("data", {}).get("children", [])
    return [post["data"]["title"] for post in posts]

def fetch_bitcoin_news_sentiment():
    api_key = os.environ["ALPHAVANTAGE_API_KEY"]
    
    time_from = (datetime.utcnow() - timedelta(days=1)).strftime("%Y%m%dT%H%M")
    
    url = (
        f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT"
        f"&tickers=CRYPTO:BTC"
        f"&time_from={time_from}"
        f"&limit=50"
        f"&sort=LATEST"
        f"&apikey={api_key}"
    )

    try:
        res = requests.get(url, timeout=5)
        data = res.json()
        articles = data.get("feed", [])

        return [article["title"] for article in articles if "title" in article]
    except Exception as e:
        print(f"Alpha Vantage error: {e}")
        return []


def lambda_handler(event, context):
    reddit_posts = []
    twitter_posts = []

    # Reddit
    reddit_token = get_reddit_token()
    subreddits = ["Bitcoin", "CryptoCurrency", "CryptoMarkets"]
    for subreddit in subreddits:
        titles = fetch_subreddit_posts(subreddit, reddit_token, limit=100)
        reddit_posts.extend(titles)

    news_posts = fetch_bitcoin_news_sentiment()
    print(f"Fetched {len(news_posts)} Bitcoin news headlines")

    return {
        "statusCode": 200,
        "body": json.dumps({"reddit posts": reddit_posts, "news posts": news_posts})
    }
