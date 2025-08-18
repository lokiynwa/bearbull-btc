import "./App.css";
import Header from "./components/Header";
import BearBullGauge from "./components/BearBullGauge";
import Averages from "./components/Averages";
import NewsTicker from "./components/NewsTicker";
import RedditRotator from "./components/RedditRotator";
import FearGreedCard from "./components/FearGreedCard";
import PriceCard from "./components/PriceCard";

export default function App() {
  const sentimentValue = 67;
  const sentimentLabel =
    sentimentValue < 34 ? "Bearish" :
    sentimentValue > 66 ? "Bullish" : "Neutral";

  const weekValues  = [64, 60, 62, 68, 70, 66, 67];
  const monthValues = [55,62,61,59,63,65,60,58,57,62,66,64,67,70,68,65,63,62,61,64,66,67,68,69,70,71,68,66,65,64];

  const newsItems = [
    "BTC edges higher as risk sentiment improves",
    "ETF flows turn positive after volatile week",
    "Whale wallets accumulate amid sideways price action",
    "Options market signals rising IV into CPI print",
    "Hash rate posts new ATH; miners adjust selling",
    "Funding flips positive across major venues",
    "Open interest climbs; traders eye resistance",
    "Derivatives suggest range expansion likely",
    "Macro: dollar pulls back as yields soften",
    "Exchange balances trend lower",
    "On-chain: active addresses tick up",
    "Futures basis widens; carry trade returns",
    "Altcoin breadth improves with BTC dominance steady",
    "Spot CVD shows steady buying",
    "Asia session leads upswing; EU follows",
    "US session: risk-on into close",
    "Market breadth turns green on daily",
    "Sentiment indexes print neutral-to-bullish",
    "Traders watch weekly close levels",
    "Analysts highlight key supply zone near $XXk"
  ];

  const redditPosts = [
    { subreddit: "r/CryptoMarkets",   title: "Open interest climbing—possible squeeze setup?" },
    { subreddit: "r/BitcoinMarkets",  title: "Miners' exchange flows down this week—bullish?" },
    { subreddit: "r/CryptoCurrency",  title: "ETF inflows recover; what's next into CPI?" },
    { subreddit: "r/Bitcoin",         title: "Range holding; daily close will be key." },
    { subreddit: "r/Bitcoin",         title: "Funding flips positive across majors." },
  ];

  const btcPrice = 64250;
  const btcChangePct = 1.87;
  const btcHistory = [61200, 62050, 61800, 62520, 63110, 62800, 64080, 64250];

  const fearGreed = 64;

  return (
    <div className="app">
      <Header />
      <div className="ticker-wrap">
        <NewsTicker items={newsItems} durationSec={60} />
      </div>
      <main className="main">
        <section className="panel">
          <h2 className="panel-title">Bitcoin Bear–Bull Meter</h2>
          <BearBullGauge value={sentimentValue} label={sentimentLabel} />
          <Averages weekValues={weekValues} monthValues={monthValues} />
          <div class="gauge-desc">
            This score ranges from 0 to 100, where 0 reflects extreme bearish sentiment and 100 reflects extreme bullish sentiment.  
            It combines AI-driven analysis of Reddit discussions and news sentiment with the Fear & Greed Index to give a daily market outlook.  
            Updated every day at 7:00 AM (UTC+1).
          </div>

        </section>

        <div className="bottom-row">
          <RedditRotator posts={redditPosts} intervalMs={30000} />
          <PriceCard price={btcPrice} changePct={btcChangePct} history={btcHistory} />
          <FearGreedCard value={fearGreed} />
        </div>
      </main>
    </div>
  );
}
