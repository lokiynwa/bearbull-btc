import { useEffect, useState } from "react";

const PRICE_URL = "https://crypto-sentiment-cache-loki.s3.us-east-1.amazonaws.com/price.json";

export function usePrice() {
  const [price, setPrice] = useState(null);
  const [change30dPct, setChange30dPct] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(PRICE_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        if (cancelled) return;

        const hist = Array.isArray(d.history_usd) ? d.history_usd : [];
        let pct = Number(d.change_pct_30d);
        if (!Number.isFinite(pct) && hist.length >= 2 && hist[0] > 0) {
          pct = ((hist[hist.length - 1] - hist[0]) / hist[0]) * 100;
        }

        setPrice(d.price_usd ?? null);
        setChange30dPct(Number.isFinite(pct) ? pct : null);
        setHistory(hist);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { price, change30dPct, history, error };
}
