import React from "react";

function mean(arr){ if(!arr?.length) return null; return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length); }

export default function Averages({ weekValues = [], monthValues = [] }) {
  const weekAvg = mean(weekValues);
  const monthAvg = mean(monthValues);

  const color = (n) => {
    if (n == null) return "#888";
    if (n < 34) return "#ff2d2d";
    if (n > 66) return "#00c853";
    return "#ffb400";
  };

  return (
    <section className="averages">
      <div className="avg-card">
        <div className="avg-meta">
          <div className="avg-label">7-day average</div>
          <div className="avg-sub">This week</div>
        </div>
        <div className="avg-value" style={{ color: color(weekAvg) }}>{weekAvg ?? "–"}</div>
      </div>
      <div className="avg-card">
        <div className="avg-meta">
          <div className="avg-label">30-day average</div>
          <div className="avg-sub">This month</div>
        </div>
        <div className="avg-value" style={{ color: color(monthAvg) }}>{monthAvg ?? "–"}</div>
      </div>
    </section>
  );
}
