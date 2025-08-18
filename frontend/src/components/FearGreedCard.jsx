import React, { useId } from "react";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function lerpHex(a, b, t) {
  const A = [a.slice(1,3), a.slice(3,5), a.slice(5,7)].map(h=>parseInt(h,16));
  const B = [b.slice(1,3), b.slice(3,5), b.slice(5,7)].map(h=>parseInt(h,16));
  const C = A.map((x,i)=>Math.round(x+(B[i]-x)*t));
  return `#${C.map(x=>x.toString(16).padStart(2,"0")).join("")}`;
}
function colourAtValue(v){
  const clamped = Math.max(0, Math.min(100, v));
  const RED="#ff2d2d", ORG="#ffb400", GRN="#00c853";
  return clamped <= 50 ? lerpHex(RED, ORG, clamped/50) : lerpHex(ORG, GRN, (clamped-50)/50);
}
function labelFor(v){
  if (v < 34) return "Fear";
  if (v > 66) return "Greed";
  return "Neutral";
}

export default function FearGreedCard({ value = 50 }) {
  const v = Math.max(0, Math.min(100, value));
  const colour = colourAtValue(v);
  const gradId = useId();
  const rotationTurn = 0.75;
  const rotationDeg  = rotationTurn * 360;
  const counterRotate = -rotationDeg;

  return (
    <section className="fg-card">
      <h3>Fear &amp; Greed</h3>
      <div className="fg-gauge">
        <CircularProgressbarWithChildren
          value={v}
          minValue={0}
          maxValue={100}
          circleRatio={0.5}
          strokeWidth={14}
          styles={buildStyles({
            rotation: rotationTurn,
            strokeLinecap: "round",
            trailColor: "#2a2a2a",
            pathColor: `url(#fg-grad-${gradId})`,
          })}
        >
          <div className="fg-number" style={{ color: colour }}>{v}</div>
          <div className="fg-status" style={{ color: colour }}>{labelFor(v)}</div>
        </CircularProgressbarWithChildren>
      </div>
      <div className="fg-foot">
        data from <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noreferrer">alternative.me/crypto/fear-and-greed-index/</a>
      </div>
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <linearGradient
            id={`fg-grad-${gradId}`}
            gradientUnits="userSpaceOnUse"
            x1="0" y1="50" x2="100" y2="50"
            gradientTransform={`rotate(${counterRotate} 50 50)`}
          >
            <stop offset="0%" stopColor="#ff2d2d" />
            <stop offset="50%" stopColor="#ffb400" />
            <stop offset="100%" stopColor="#00c853" />
          </linearGradient>
        </defs>
      </svg>
    </section>
  );
}
