import json

def lambda_handler(event, context):
    # This is a placeholder for the actual implementation of fetching social media data.
    tweets = [
        "Bitcoin is mooning!",
        "I'm buying more BTC today",
        "Crypto is scary lately..."
    ]
    
    reddit_posts = [
        "HODL or sell?",
        "BTC just dropped $2k 😬",
        "This is the accumulation phase"
    ]
    
    all_posts = tweets + reddit_posts

    return {
        'statusCode': 200,
        'body': json.dumps({'posts': all_posts})
    }