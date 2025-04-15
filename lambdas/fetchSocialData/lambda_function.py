import os
import json
import requests
from base64 import b64encode

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

def is_relevant(title):
    keywords = [
        "bitcoin", "btc", "crypto", "halving", "satoshi", "blockchain", "wallet",
        "coinbase", "binance", "kraken", "hodl", "bull", "bear", "pump", "dump",
        "buy", "sell", "price", "crash", "moon", "fomo", "etf", "volatility", "market",
        "regulation", "mining", "trading", "investment", "portfolio", "loss", "gain",
        "profit", "liquidate", "greed", "fear", "support", "resistance", "chart",
        "prediction", "correction", "bottom", "top", "trend", "bullish", "bearish"
    ]
    title_lower = title.lower()
    return any(word in title_lower for word in keywords)

def lambda_handler(event, context):
    token = get_reddit_token()
    subreddits = ["Bitcoin", "CryptoCurrency", "CryptoMarkets"]
    
    all_titles = []
    for subreddit in subreddits:
        titles = fetch_subreddit_posts(subreddit, token, limit=200)
        relevant_titles = [t for t in titles if is_relevant(t)]
        all_titles.extend(relevant_titles)

    return {
        "statusCode": 200,
        "body": json.dumps({"posts": all_titles})
    }
