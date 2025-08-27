import "./App.css";
import Header from "./components/Header";
import BearBullGauge from "./components/BearBullGauge";
import Averages from "./components/Averages";
import NewsTicker from "./components/NewsTicker";
import RedditRotator from "./components/RedditRotator";
import FearGreedCard from "./components/FearGreedCard";
import PriceCard from "./components/PriceCard";
import { useSentimentData } from "./api/useSentiment";

export default function App() {
  const {
    weekValues,
    monthValues,
    gaugeScore,
    gaugeLabel,
    redditPosts,
    newsHeadlines,
    fgValue,
    error,
  } = useSentimentData();

  const sentimentValue = gaugeScore ?? 0;
  const sentimentLabel = gaugeLabel ?? "—";

  const newsItems = (newsHeadlines && newsHeadlines.length)
    ? newsHeadlines
    : [
        "Loading latest headlines…",
        "If this persists, check S3 CORS settings.",
      ];

  const redditList = (redditPosts && redditPosts.length)
    ? redditPosts
    : [
        { subreddit: "r/Bitcoin", title: "Loading Reddit posts…" },
        { subreddit: "r/CryptoMarkets", title: "…" },
        { subreddit: "r/CryptoCurrency", title: "…" },
      ];

  const btcPrice = 64250;
  const btcChangePct = 1.87;
  const btcHistory = [61200, 62050, 61800, 62520, 63110, 62800, 64080, 64250];

  return (
    <div className="app">
      <Header />
      <div className="ticker-wrap">
      <NewsTicker items={newsItems} speedPxPerSec={100} />
      </div>

      <main className="main">
        <section className="panel">
          <h2 className="panel-title">Bitcoin Bear–Bull Meter</h2>

          {}
          {error && (
            <div
              style={{
                width: "100%",
                background: "#2a2a2a",
                color: "#ffb400",
                border: "1px solid #3a3a3a",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                textAlign: "center",
                fontSize: 14,
              }}
            >
              Data issue: {error}
            </div>
          )}

          <BearBullGauge value={sentimentValue} label={sentimentLabel} />
          <Averages
            weekValues={weekValues || []}
            monthValues={monthValues || []}
          />

          <div className="gauge-desc">
            This score ranges from 0 to 100, where 0 reflects extreme bearish sentiment and 100 reflects extreme bullish sentiment.
            It combines AI-driven sentiment analysis of Reddit posts and news headlines with the Fear & Greed Index to give a daily market outlook.
          </div>
        </section>

        <div className="bottom-row">
          <RedditRotator posts={redditList} intervalMs={30000} />
          <PriceCard price={btcPrice} changePct={btcChangePct} history={btcHistory} />
          <FearGreedCard value={fgValue ?? 50} />
        </div>
      </main>
    </div>
  );
}
