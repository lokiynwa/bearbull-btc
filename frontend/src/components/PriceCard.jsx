import React, { useMemo } from "react";

function formatUSD(n) {
  return n == null ? "—" : n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function buildPath(data, w = 100, h = 40) {
  if (!data || data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / range) * h;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  });
  return points.join(" ");
}

export default function PriceCard({ price = null, changePct = 0, history = [] }) {
  const color = changePct >= 0 ? "#00c853" : "#ff2d2d";
  const sign = changePct >= 0 ? "+" : "−";
  const path = useMemo(() => buildPath(history), [history]);

  return (
    <section className="price-card">
      <header className="price-head">
        <span className="price-title">Bitcoin</span>
        <span className="price-tag">BTC</span>
      </header>
      <div className="price-main">
        <div className="price-value">{formatUSD(price)}</div>
        <div className="price-change" style={{ color }}>
          {sign}{Math.abs(changePct).toFixed(2)}%
        </div>
      </div>
      <div className="sparkline" aria-hidden="true">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none">
          <path d={path} stroke={color} strokeWidth="2" fill="none" />
        </svg>
      </div>
    </section>
  );
}
