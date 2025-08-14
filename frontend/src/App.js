import "./App.css";
import Header from "./components/Header";
import BearBullGauge from "./components/BearBullGauge";

export default function App() {
  const sentimentValue = 50;
  const sentimentLabel = sentimentValue < 34
    ? "Bearish"
    : sentimentValue > 66
    ? "Bullish"
    : "Neutral";

  return (
    <div className="app">
      <Header />
      <main className="main">
        <section className="panel">
          <BearBullGauge value={sentimentValue} label={sentimentLabel} />
        </section>
      </main>
    </div>
  );
}
