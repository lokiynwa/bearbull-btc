import React, { useMemo } from "react";

function formatUSD(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function Sparkline({
  data = [],
  stroke = "#00c853",
  vbWidth = 100,
  vbHeight = 30,
  strokeWidth = 3,
}) {
  const path = React.useMemo(() => {
    if (!data || data.length < 2) return "";

    const PAD = Math.max(2, Math.ceil(strokeWidth * 1.5));
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;

    const innerW = vbWidth - PAD * 2;
    const innerH = vbHeight - PAD * 2;
    const stepX = innerW / (data.length - 1);

    const pts = data.map((v, i) => {
      const x = PAD + i * stepX;
      const y = PAD + (innerH - ((v - min) / span) * innerH);
      return [x, y];
    });

    return pts.reduce(
      (d, [x, y], i) => (i ? `${d} L ${x} ${y}` : `M ${x} ${y}`),
      ""
    );
  }, [data, vbWidth, vbHeight, strokeWidth]);

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      style={{ overflow: "visible" }}
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export default function PriceCard({ price, change30dPct, history = [] }) {
  const computedPct = useMemo(() => {
    if (Number.isFinite(change30dPct)) return change30dPct;
    if (history.length >= 2 && history[0] > 0) {
      return ((history[history.length - 1] - history[0]) / history[0]) * 100;
    }
    return null;
  }, [change30dPct, history]);

  const up = (computedPct ?? 0) >= 0;
  const color = up ? "#00c853" : "#ff3b30";
  const pctText = computedPct == null ? "—" : `${up ? "+" : ""}${computedPct.toFixed(2)}%`;

  return (
    <section className="price-card">
      <h3>BTC Price</h3>
      <div className="price-row">
        <div className="price-main">{formatUSD(price)}</div>
        <div className="price-pct" style={{ color }}>{pctText} in 30d</div>
      </div>
      <div className="price-chart">
        <Sparkline data={history} stroke={color} />
      </div>
    </section>
  );
}
