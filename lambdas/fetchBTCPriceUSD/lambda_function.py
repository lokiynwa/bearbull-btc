import json
import urllib3

#deployment test for AWS Lambda

def lambda_handler(event, context):
    http = urllib3.PoolManager()
    url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    response = http.request('GET', url)
    data = json.loads(response.data.decode('utf-8'))
    price = data['bitcoin']['usd']
    
    return {
        'statusCode': 200,
        'body': json.dumps({'bitcoin_price_usd': price})
    }