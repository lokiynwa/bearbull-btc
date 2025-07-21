# bearbull-btc
A personal project built as a computer science student to showcase skills in serverless architecture, APIs, sentiment analysis, and cloud hosting.

This web app fetches the latest Bitcoin price from the CoinGecko API, collects recent tweets and Reddit posts about Bitcoin, and uses AWS Comprehend to analyse market sentiment. It then calculates a real-time Bear/Bull score (0–100) indicating how positive or negative the market is feeling.

---

## 📈 Features

- ✅ Fetch live Bitcoin price in USD  
- ✅ Collect and analyse social media posts (Twitter + News Article)  
- ✅ Perform sentiment analysis using **AWS Comprehend**  
- ✅ Generate a Bear/Bull market sentiment score (0–100)  
- ✅ Host on **AWS Lambda** and expose endpoints via **API Gateway**  
- 🚧 Frontend (React) hosted on AWS (in progress)  

---

## 🧰 Tech Stack

| Category           | Tool/Service                    |
|--------------------|---------------------------------|
| 🧠 Sentiment Analysis | AWS Comprehend               |
| ☁️ Serverless Backend | AWS Lambda + API Gateway     |
| 🪙 Price Data        | CoinGecko API                  |
| 💬 Social Data       | Twitter API, Reddit API (PRAW) |
| 🌍 Frontend          | React + Tailwind (planned)     |
| 🔗 Repo Hosting      | GitHub                         |