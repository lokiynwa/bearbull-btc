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
        "worried", "excited", "scared", "unsure", "feel", "hype", "dumping",
        "moon", "fear", "greed", "panic", "nervous", "bullish", "bearish",
        "confused", "think", "believe", "bet", "opinion", "strategy"
    ]
    title_lower = title.lower()
    return any(word in title_lower for word in keywords)

def lambda_handler(event, context):
    token = get_reddit_token()
    subreddits = ["Bitcoin", "CryptoCurrency", "CryptoMarkets"]
    
    all_titles = []
    for subreddit in subreddits:
        titles = fetch_subreddit_posts(subreddit, token, limit=500)
        relevant_titles = [t for t in titles if is_relevant(t)]
        print(f"{subreddit}: {len(relevant_titles)} relevant posts out of {len(titles)} fetched")
        all_titles.extend(relevant_titles)

    return {
        "statusCode": 200,
        "body": json.dumps({"posts": all_titles})
    }
