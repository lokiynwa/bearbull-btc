import { useEffect, useMemo, useState } from "react";

const LATEST_URL  = "https://crypto-sentiment-cache-loki.s3.us-east-1.amazonaws.com/sentiment-latest.json";
const HISTORY_URL = "https://crypto-sentiment-cache-loki.s3.us-east-1.amazonaws.com/history.json";

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function scoreToLabel(v) {
  if (v < 34) return "Bearish";
  if (v > 66) return "Bullish";
  return "Neutral";
}

function lastN(arr, n) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(-n);
}

export function useSentimentData() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [lat, hist] = await Promise.allSettled([
          fetchJson(LATEST_URL),
          fetchJson(HISTORY_URL),
        ]);
        if (cancelled) return;

        if (lat.status === "fulfilled") setLatest(lat.value);
        if (hist.status === "fulfilled") setHistory(hist.value);
        if (lat.status === "rejected" || hist.status === "rejected") {
          const msgs = [
            lat.status === "rejected" ? `latest: ${lat.reason?.message || lat.reason}` : null,
            hist.status === "rejected" ? `history: ${hist.reason?.message || hist.reason}` : null,
          ].filter(Boolean).join(" | ");
          setError(msgs || "Partial data error");
        } else {
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const computed = useMemo(() => {
    const histScores = Array.isArray(history)
      ? history.map(d => Number(d.score)).filter(n => Number.isFinite(n))
      : [];

    const weekValues  = lastN(histScores, 7);
    const monthValues = lastN(histScores, 30);

    const weekAvg  = weekValues.length  ? Math.round(weekValues.reduce((a,b)=>a+b,0) / weekValues.length)   : null;
    const monthAvg = monthValues.length ? Math.round(monthValues.reduce((a,b)=>a+b,0) / monthValues.length) : null;

    const gaugeScore = latest?.overall?.average_score ?? null;
    const gaugeLabel = latest?.overall?.label
      ? latest.overall.label.charAt(0) + latest.overall.label.slice(1).toLowerCase()
      : (Number.isFinite(gaugeScore) ? scoreToLabel(gaugeScore) : "—");

    const fgScore = Number(latest?.fear_and_greed_index?.score);
    const fgValue = Number.isFinite(fgScore) ? Math.round(fgScore) : null;

    const redditPosts = Array.isArray(latest?.reddit?.posts)
      ? latest.reddit.posts.map(p => ({
          subreddit: p.subreddit || "r/Bitcoin",
          title: p.title || "",
        }))
      : [];

    const newsHeadlines = Array.isArray(latest?.news?.posts)
      ? latest.news.posts.map(p => p.title).filter(Boolean)
      : [];

    return {
      weekValues,
      monthValues,
      weekAvg,
      monthAvg,
      gaugeScore: Number.isFinite(gaugeScore) ? Math.round(gaugeScore) : null,
      gaugeLabel,
      redditPosts,
      newsHeadlines,
      fgValue,
    };
  }, [latest, history]);

  return { ...computed, loading, error, rawLatest: latest, rawHistory: history };
}
