import os
import json
import requests
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

# --- Twitter via Nitter ---

def fetch_nitter_tweets(username):
    url = f"https://nitter.poast.org/{username}/rss"
    try:
        res = requests.get(url, timeout=5)
        feed = feedparser.parse(res.text)
        return [entry.title for entry in feed.entries[:10]]
    except Exception as e:
        print(f"Failed to fetch from {username}: {e}")
        return []

# --- Combined Lambda Handler ---

def lambda_handler(event, context):
    reddit_posts = []
    twitter_posts = []

    # Reddit
    reddit_token = get_reddit_token()
    subreddits = ["Bitcoin", "CryptoCurrency", "CryptoMarkets"]
    for subreddit in subreddits:
        titles = fetch_subreddit_posts(subreddit, reddit_token, limit=100)
        reddit_posts.extend(titles)

    # Twitter via Nitter
    twitter_users = ["Saylor", "CryptoCobain", "TheCryptoDog", "TheBitcoinConf"]
    for user in twitter_users:
        tweets = fetch_nitter_tweets(user)
        twitter_posts.extend(tweets)

    return {
        "statusCode": 200,
        "body": json.dumps({"reddit posts": reddit_posts, "twitter posts": twitter_posts})
    }
