import React from "react";

function lerpHex(a, b, t) {
  const pa = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
  const pb = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
  const pc = pa.map((ca,i) => Math.round(ca + (pb[i] - ca) * t));
  return `#${pc.map(x => x.toString(16).padStart(2,"0")).join("")}`;
}
function colourAtValue(v){
  const clamped = Math.max(0, Math.min(100, v));
  const mid = 50, RED="#ff2d2d", ORG="#ffb400", GRN="#00c853";
  return clamped <= mid
    ? lerpHex(RED, ORG, clamped / mid)
    : lerpHex(ORG, GRN, (clamped - mid) / mid);
}

function mean(arr){
  if(!arr || !arr.length) return null;
  return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
}

export default function Averages({ weekValues = [], monthValues = [] }) {
  const weekAvg = mean(weekValues);
  const monthAvg = mean(monthValues);
  const weekColour = weekAvg == null ? "#888" : colourAtValue(weekAvg);
  const monthColour = monthAvg == null ? "#888" : colourAtValue(monthAvg);

  return (
    <section className="averages">
      <div className="avg-card">
        <div className="avg-meta">
          <div className="avg-label">7-day average</div>
          <div className="avg-sub">This week</div>
        </div>
        <div className="avg-value" style={{ color: weekColour }}>
          {weekAvg ?? "–"}
        </div>
      </div>
      <div className="avg-card">
        <div className="avg-meta">
          <div className="avg-label">30-day average</div>
          <div className="avg-sub">This month</div>
        </div>
        <div className="avg-value" style={{ color: monthColour }}>
          {monthAvg ?? "–"}
        </div>
      </div>
    </section>
  );
}
