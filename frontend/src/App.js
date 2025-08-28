import "./App.css";
import Header from "./components/Header";
import BearBullGauge from "./components/BearBullGauge";
import Averages from "./components/Averages";
import NewsTicker from "./components/NewsTicker";
import RedditRotator from "./components/RedditRotator";
import FearGreedCard from "./components/FearGreedCard";
import PriceCard from "./components/PriceCard";
import { useSentimentData } from "./api/useSentiment";
import { usePrice } from "./api/usePrice";

export default function App() {
  const {
    weekValues, monthValues,
    gaugeScore, gaugeLabel,
    redditPosts, newsHeadlines,
    fgValue, error,
  } = useSentimentData();

  const { price, change30dPct, history } = usePrice();

  const sentimentValue = gaugeScore ?? 0;
  const sentimentLabel = gaugeLabel ?? "—";

  const newsItems = newsHeadlines?.length ? newsHeadlines : ["Loading latest headlines…"];

  const redditList = redditPosts?.length
    ? redditPosts.map(p => (typeof p === "string" ? p : p.title))
    : ["Loading Reddit posts…", "…", "…"];

  return (
    <div className="app">
      <Header />
      <div className="ticker-wrap">
        <NewsTicker items={newsItems} speedPxPerSec={80} />
      </div>

      <main className="main">
        <section className="panel">
          <h2 className="panel-title">Bitcoin Bear–Bull Meter</h2>
          {error && <div className="panel-note">Data issue: {error}</div>}
          <BearBullGauge value={sentimentValue} label={sentimentLabel} />
          <Averages weekValues={weekValues || []} monthValues={monthValues || []} />
          <div className="gauge-desc">
            This score ranges from 0 to 100, where 0 reflects extreme bearish sentiment and 100 reflects extreme bullish sentiment.
            It combines AI-driven sentiment analysis of Reddit posts and news headlines with the Fear & Greed Index to give a daily market outlook.
          </div>
        </section>

        <div className="bottom-row">
          <RedditRotator posts={redditList} intervalMs={30000} />
          <PriceCard price={price} change30dPct={change30dPct} history={history} />
          <FearGreedCard value={fgValue ?? 50} />
        </div>
      </main>
    </div>
  );
}
